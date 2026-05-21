"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, LogIn } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "Invalid credentials");
        return;
      }
      login({
        userId: data.user_id,
        token: data.token,
        email,
        username: data.username ?? "",
        onboardingDone: data.onboarding_done ?? false,
      });
      router.push("/");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell>
      <div className="relative min-h-[calc(100svh-4rem)] flex flex-col px-4 pt-8 pb-10 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-primary/8 blur-3xl" />
          <div className="absolute bottom-24 -left-16 w-64 h-64 rounded-full bg-brand-glow/5 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col gap-2 mb-10"
        >
          <h1 className="text-brutalist text-[clamp(2.5rem,12vw,4rem)] leading-none text-text-primary">
            SIGN <span className="text-brand-glow glow-green">IN</span>
          </h1>
          <p className="text-text-muted text-sm font-medium">Welcome back. Place your bets.</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={handleSubmit}
          className="relative z-10 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-widest">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-13 px-4 rounded-xl glass text-text-primary text-sm placeholder:text-text-muted/50 outline-none focus:border-brand-glow/50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-widest">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-13 px-4 pr-12 rounded-xl glass text-text-primary text-sm placeholder:text-text-muted/50 outline-none focus:border-brand-glow/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs font-medium px-1"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-brand-primary text-surface-base font-black text-brutalist text-sm tracking-widest uppercase transition-all duration-200 active:scale-[0.97] hover:bg-brand-glow shadow-lg shadow-brand-primary/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-surface-base/30 border-t-surface-base rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={16} strokeWidth={2.5} />
                Sign In
              </>
            )}
          </button>

          <p className="text-center text-text-muted text-sm mt-2">
            No account?{" "}
            <Link href="/register" className="text-brand-glow font-semibold hover:underline">
              Register
            </Link>
          </p>
        </motion.form>
      </div>
    </MobileShell>
  );
}
