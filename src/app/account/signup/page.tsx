"use client";

import { useState, FormEvent } from "react";
import { Shield, Eye, EyeOff, Lock, Mail, ChevronRight, ArrowLeft, User } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { supabaseReady } = useAuth();
  const router = useRouter();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabaseReady) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/account/callback`,
          data: { full_name: name },
        },
      });

      if (error) throw error;

      setMessage("✅ Account created! Check your email to verify.");
    } catch (err: any) {
      setError(err?.message || "Sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 flex items-center gap-2 text-white/70 hover:text-white transition group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" />
        <span className="text-sm">Back</span>
      </button>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mb-6 shadow-lg">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">

            {/* NAME */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute inset-y-0 left-3 text-white/40 flex items-center" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-500"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute inset-y-0 left-3 text-white/40 flex items-center" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-500"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute inset-y-0 left-3 text-white/40 flex items-center" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-10 pr-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-500"
                  placeholder="******"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 text-white/40 hover:text-white/70"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="p-3 text-sm text-red-300 bg-red-600/20 border border-red-500/30 rounded-lg">{error}</div>}
            {message && <div className="p-3 text-sm text-emerald-300 bg-emerald-600/20 border border-emerald-500/30 rounded-lg">{message}</div>}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-white font-medium shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Create Account"}
            </button>

            {/* SIGN IN */}
            <p className="text-white/70 text-sm text-center mt-4">
              Already have an account?{" "}
              <a href="/account/signin" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Sign in
              </a>
            </p>
          </form>

        </div>
      </div>
    </div>
  );
}
