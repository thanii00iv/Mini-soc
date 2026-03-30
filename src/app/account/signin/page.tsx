"use client";

import { useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { 
  Shield, Mail, Lock, Eye, EyeOff, ChevronRight, ArrowLeft 
} from "lucide-react";

export default function SignInPage() {
  const { supabaseReady, envError } = useAuth();
  const search = useSearchParams();
  const router = useRouter();

  const redirectTo = search.get("redirect") || "/";

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabaseReady) return;
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email:"itxrishab69@gmail.com",
        password:"Qwerty@123",
      });

      if (error) throw error;

      setMessage("Signed in successfully");
      router.push(redirectTo);
    } catch (err: any) {
      setError(err?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const onMagicLink = async () => {
    if (!supabaseReady) return;
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });

      if (error) throw error;

      setMessage("Magic link sent. Check your email.");
    } catch (err: any) {
      setError(err?.message || "Magic link failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Glow background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="relative w-full max-w-md">

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute -top-16 left-0 flex items-center gap-2 text-white/70 hover:text-white transition group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" />
          <span className="text-sm">Back</span>
        </button>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-lg">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/70">Sign in to SecureLog Analytics</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm text-white/90">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-3 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-12 pl-12 pr-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm text-white/90">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-3 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 pl-12 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-white/40"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Alerts */}
            {error && <div className="p-4 bg-red-500/20 text-red-200 rounded-xl text-sm">{error}</div>}
            {message && <div className="p-4 bg-green-500/20 text-green-200 rounded-xl text-sm">{message}</div>}
            {envError && <div className="p-4 bg-yellow-500/20 text-yellow-200 rounded-xl text-sm">{envError}</div>}

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> :
                <>
                  <span>Sign In</span>
                  <ChevronRight size={16} />
                </>
              }
            </button>

            {/* Magic Link */}
            <button
              type="button"
              onClick={onMagicLink}
              disabled={!email || loading}
              className="w-full h-12 bg-white/10 border border-white/20 text-white rounded-xl mt-2"
            >
              Send Magic Link
            </button>

            {/* Sign Up Link */}
            <div className="text-center pt-4 text-sm text-white/70">
              Don't have an account?{" "}
              <a 
                href={`/account/signup${typeof window !== "undefined" ? window.location.search : ""}`}
                className="text-blue-400 hover:text-blue-300"
              >
                Create one here
              </a>
            </div>
          </form>
        </div>

        <div className="text-center mt-8 text-white/50 text-xs">
          Secure • Encrypted • Protected
        </div>
      </div>
    </div>
  );
}
