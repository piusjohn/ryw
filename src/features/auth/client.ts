import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// SecureStore has platform-dependent size limits, so store a session in bounded chunks.
const storage = {
  async getItem(name: string) {
    if (Platform.OS === 'web') return typeof window === 'undefined' ? null : window.localStorage.getItem(name);
    const countText = await SecureStore.getItemAsync(`${name}.count`);
    if (!countText) return null;
    const count = Number(countText);
    if (!Number.isSafeInteger(count) || count < 1 || count > 100) return null;
    const chunks = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${name}.${i}`)));
    return chunks.some(part => part === null) ? null : chunks.join('');
  },
  async setItem(name: string, value: string) {
    if (Platform.OS === 'web') { if (typeof window !== 'undefined') window.localStorage.setItem(name, value); return; }
    // A failed write removes the count first so a partial session is never loaded.
    const previousCount = Math.min(Number(await SecureStore.getItemAsync(`${name}.count`)) || 0, 100);
    await SecureStore.deleteItemAsync(`${name}.count`);
    const chunks = value.match(/[\s\S]{1,1000}/g) ?? [''];
    for (let i = 0; i < chunks.length; i++) await SecureStore.setItemAsync(`${name}.${i}`, chunks[i]);
    for (let i = chunks.length; i < previousCount; i++) await SecureStore.deleteItemAsync(`${name}.${i}`);
    await SecureStore.setItemAsync(`${name}.count`, String(chunks.length));
  },
  async removeItem(name: string) {
    if (Platform.OS === 'web') { if (typeof window !== 'undefined') window.localStorage.removeItem(name); return; }
    const count = Number(await SecureStore.getItemAsync(`${name}.count`)) || 0;
    await SecureStore.deleteItemAsync(`${name}.count`);
    for (let i = 0; i < Math.min(count, 100); i++) await SecureStore.deleteItemAsync(`${name}.${i}`);
  },
};
export const supabase = url && key ? createClient(url, key, { auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } }) : null;
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', state => { if (state === 'active') supabase.auth.startAutoRefresh(); else supabase.auth.stopAutoRefresh(); });
}
