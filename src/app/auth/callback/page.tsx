"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (data.session) {
        router.replace("/");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === "SIGNED_IN") {
        router.replace("/");
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, [router]);

  return <p>Signing you in...</p>;
}

