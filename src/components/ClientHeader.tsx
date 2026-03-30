"use client";

import { useAuth } from "@/components/AuthProvider";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, LogOut } from "lucide-react";

export default function ClientHeader() {
  const router = useRouter();
  const { user, signOut, supabaseReady, envError } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSignInDemo = async () => {
    if (!supabaseReady) return;
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const email = window.prompt("Enter email for magic link sign-in") || "";
      if (!email) return;
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      alert("Magic link sent. Check your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="p-2 rounded-md border border-black/10 bg-white/70 shadow-sm hover:bg-white transition dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      >
        {mounted ? (
          isDark ? (
            <Sun size={16} className="text-gray-700 dark:text-gray-200" />
          ) : (
            <Moon size={16} className="text-gray-700 dark:text-gray-200" />
          )
        ) : (
          <span className="inline-block w-4 h-4" />
        )}
      </button>

      {/* Display environment/Supabase error */}
      {!supabaseReady && envError && (
        <span className="text-xs text-red-600 dark:text-red-400">{envError}</span>
      )}

      {/* Auth State Controls */}
      {user ? (
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-sm text-gray-600 dark:text-gray-400">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="flex items-center gap-1 rounded-md border border-black/10 bg-white/70 px-3 py-1.5 text-sm shadow-sm hover:bg-white transition dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/account/signin")}
            className="rounded-md border border-black/10 bg-white/70 px-3 py-1.5 text-sm shadow-sm hover:bg-white transition dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            Sign in
          </button>
          <button
            onClick={() => router.push("/account/signup")}
            className="rounded-md border border-black/10 bg-white/70 px-3 py-1.5 text-sm shadow-sm hover:bg-white transition dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            Sign up
          </button>
        </div>
      )}
    </div>
  );
}
