'use client';

import * as React from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface UseUserResult {
  user: User | null;
  data: User | null;
  loading: boolean;
  refetch: () => void;
}

const useUser = (): UseUserResult => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Fetch user from Supabase session
  const fetchUser = React.useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error fetching session:', error.message);
      setUser(null);
    } else {
      setUser(data.session?.user ?? null);
    }
    setLoading(false);
  }, []);

  // Automatically refresh on mount and on auth state change
  React.useEffect(() => {
    const supabase = getSupabaseClient();
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchUser]);

  // Manual refetch
  const refetch = React.useCallback(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    data: user,
    loading,
    refetch,
  };
};

export { useUser };
export default useUser;
