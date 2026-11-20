import { useState } from 'react';
import { TextInput } from 'react-native';
import { Button, Card, Copy, Screen, ui } from '@/components/reading-ui';
import { palette as c } from '@/constants/design';
import { useAuth } from '@/features/auth/provider';
import { supabase } from '@/features/auth/client';
export default function ProfileScreen() {
  const { session, loading, configured } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const perform = async (action: 'login' | 'register' | 'reset' | 'logout') => {
    if (!supabase || busy) return; setBusy(true); setMessage('');
    try {
      if (action !== 'logout' && !email.trim()) throw new Error('Enter your email address.');
      const result = action === 'logout' ? await supabase.auth.signOut({ scope: 'local' }) : action === 'reset' ? await supabase.auth.resetPasswordForEmail(email.trim()) : action === 'register' ? await supabase.auth.signUp({ email: email.trim(), password }) : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (action === 'register') setMessage('Check your email for a confirmation link if your project requires verification.');
      if (action === 'reset') setMessage('If an account exists, check your email for reset instructions.');
      if (action === 'logout') { setPassword(''); setMessage('Signed out. Your reading library remains on this device.'); }
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not complete that request. Please try again.'); }
    finally { setBusy(false); }
  };
  return <Screen><Copy style={ui.eyebrow}>YOUR ACCOUNT</Copy><Copy style={ui.title}>Profile</Copy>
    <Card><Copy style={ui.heading}>Cloud backup</Copy><Copy>Cloud synchronization is still being built. Your reading data is saved on this device and is not backed up.</Copy><Copy style={ui.badge}>Saved locally · Not synced</Copy></Card>
    {!configured ? <Card><Copy>Account sign-in is unavailable until Supabase is configured. You can keep reading offline.</Copy></Card> : loading ? <Copy>Loading account…</Copy> : session ? <Card><Copy style={ui.heading}>Signed in</Copy><Copy>{session.user.email}</Copy><Copy style={ui.muted}>Your current library remains on this device. Account backup and restore are not yet available.</Copy><Button label="Sign out" disabled={busy} secondary onPress={() => void perform('logout')} /></Card> : <Card><Copy style={ui.heading}>Sign in or create an account</Copy><TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="Email address" style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 14, color: c.ink }} /><TextInput accessibilityLabel="Password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Password" style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 14, color: c.ink }} /><Button label={busy ? 'Please wait…' : 'Sign in'} disabled={busy} onPress={() => void perform('login')} /><Button label="Create account" disabled={busy} secondary onPress={() => void perform('register')} /><Button label="Send password reset email" disabled={busy} secondary onPress={() => void perform('reset')} /></Card>}
    {!!message && <Copy accessibilityRole="alert">{message}</Copy>}
  </Screen>;
}
