import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './client';
type AuthContextValue = { session: Session | null; loading: boolean; configured: boolean };
const AuthContext = createContext<AuthContextValue>({ session: null, loading: true, configured: false });
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null); const [loading, setLoading] = useState(!!supabase);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, value) => { if (active) { setSession(value); setLoading(false); } });
    void supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false); } }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  return <AuthContext value={{ session, loading, configured: !!supabase }}>{children}</AuthContext>;
}
export const useAuth = () => useContext(AuthContext);
