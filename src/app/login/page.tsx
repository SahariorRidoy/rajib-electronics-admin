"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Sparkles, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setTokens } from "@/features/auth/auth.slice";
import { useGetPublicSettingsQuery } from "@/services/settings.api";

export default function AdminLoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { data: settings } = useGetPublicSettingsQuery();
  const brand = settings?.siteName ?? "Rajib Electronics";

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/admin/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(
          data?.message || data?.code || "Invalid email or password"
        );
      }

      const { accessToken, refreshToken } = data.data;
      if (!accessToken || !refreshToken) throw new Error("No tokens received");

      dispatch(setTokens({ accessToken, refreshToken }));

    
      router.push("/dashboard");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Login failed:", err);
      setApiError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-100 rounded-full mix-blend-multiply blur-3xl opacity-40 animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-100 rounded-full mix-blend-multiply blur-3xl opacity-40 animate-pulse"
          style={{ animationDelay: "700ms" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: "1000ms" }}
        />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#167389] to-[#167389] rounded-2xl shadow-2xl mb-4 transform hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#167389] to-[#167389] mb-2">
            {brand}
          </h1>
          <p className="text-[#167389] font-medium text-lg">Admin Dashboard</p>
        </div>

        {/* Form */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-pink-100">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-[#167389]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rajibelectornics.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition bg-white/60 text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-[#167389]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition bg-white/60 text-gray-800 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#167389] hover:text-pink-700 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-pink-300 text-pink-600 focus:ring-pink-500 focus:ring-2 cursor-pointer"
                />
                <span className="ml-2 text-gray-600 group-hover:text-pink-700 transition">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="text-[#167389] hover:text-[#125a6d] font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#167389]  to-[#167389]  hover:from-cyan-200 hover:to-cyan-600  text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>

            {apiError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {apiError}
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pink-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Secure Admin Access
              </span>
            </div>
          </div>

          {/* Security note */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <Lock className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-pink-900 mb-1">
                  Protected Admin Panel
                </h4>
                <p className="text-xs text-pink-700 leading-relaxed">
                  This area is restricted to authorized administrators only. All
                  activities are logged for security.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} {brand}. All rights reserved.</p>
         
        </div>
      </div>
    </main>
  );
}
