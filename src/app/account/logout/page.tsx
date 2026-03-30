"use client";

import { Shield, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import React from "react";

export default function LogoutPage(): React.ReactElement {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    router.push("/account/signin");
  };

  const handleBack = (): void => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      <div className="relative w-full max-w-md">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="absolute -top-16 left-0 flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back</span>
        </button>

        {/* Main card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-6 shadow-lg">
              <LogOut size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Sign Out</h1>
            <p className="text-white/70">Are you sure you want to sign out of SecureLog?</p>
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleSignOut}
              className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>

            <button
              onClick={handleBack}
              className="w-full h-12 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
          </div>

          {/* Info box */}
          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl text-left text-sm text-white/60 space-y-1">
            <p>
              <Shield size={14} className="inline mr-2" />
              <span className="font-semibold">Frontend:</span> Next.js, Tailwind, Shadcn/UI
            </p>
            <p>
              <span className="font-semibold">Auth & DB:</span> Supabase
            </p>
            <p>
              <span className="font-semibold">Deploy:</span> Vercel
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-white/50 text-xs">Thank you for using SecureLog Analytics</p>
        </div>
      </div>
    </div>
  );
}
