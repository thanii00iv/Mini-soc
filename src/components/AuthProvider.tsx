"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabaseClient";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  supabaseReady: boolean;
  envError?: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [envError, setEnvError] = useState<string | undefined>();

  useEffect(() => {
    try {
      const supabase = getSupabaseClient();
      setSupabaseReady(true);
      supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
        setSession(result.data.session ?? null);
        setUser(result.data.session?.user ?? null);
        setLoading(false);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        setSession(s ?? null);
        setUser(s?.user ?? null);
      });
      return () => sub.subscription.unsubscribe();
    } catch (e: any) {
      setEnvError(e?.message || "Supabase not configured");
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      supabaseReady,
      envError,
      signOut: async () => {
        if (!supabaseReady) return;
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
      },
    }),
    [user, session, loading, supabaseReady, envError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


