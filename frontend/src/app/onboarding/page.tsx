"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { User, CheckCircle2, Shield, ArrowRight, Sparkles, Lock, FileCheck } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import { useAuth } from "@/context/AuthContext";
import { authFetch, updateUser } from "@/lib/auth";

const STEPS = ["username", "legal"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) router.replace("/register");
    else if (user.onboardingDone) router.replace("/");
  }, [user, router]);

  async function handleUsernameNext(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim().length < 2) {
      setError("Username must be at least 2 characters");
      return;
    }
    setError("");
    setStep("legal");
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    if (!age || !terms || !privacy) {
      setError("Please confirm all checkboxes");
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Failed to complete onboarding");
        return;
      }

      const data = await res.json().catch(() => ({}));
      updateUser({ username: data.username ?? username.trim(), onboardingDone: data.onboarding_done ?? true });
      refresh();
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell>
      <div className="relative min-h-[calc(100svh-4rem)] flex flex-col px-4 pt-10 pb-10 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-primary/8 blur-3xl" />
          <div className="absolute bottom-24 -left-16 w-64 h-64 rounded-full bg-brand-glow/5 blur-3xl" />
        </div>

        <div className="relative z-10 flex gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                STEPS.indexOf(step) >= i ? "bg-brand-primary" : "bg-surface-overlay"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "username" && (
            <motion.form
              key="username"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleUsernameNext}
              className="relative z-10 flex flex-col gap-6 flex-1"
            >
              <div className="flex flex-col gap-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-primary/15 flex items-center justify-center mb-2">
                  <User size={28} className="text-brand-glow" />
                </div>
                <h1 className="text-brutalist text-[clamp(2rem,10vw,3.5rem)] leading-none text-text-primary">
                  WHAT'S YOUR <span className="text-brand-glow glow-green">NAME?</span>
                </h1>
                <p className="text-text-muted text-sm">This is how other players will see you.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-widest">Username</label>
                <input
                  type="text"
                  autoFocus
                  autoComplete="nickname"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. LuckyAce99"
                  maxLength={30}
                  className="w-full h-14 px-4 rounded-xl glass text-text-primary text-base placeholder:text-text-muted/50 outline-none focus:border-brand-glow/50 transition-colors"
                />
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs px-1">
                    {error}
                  </motion.p>
                )}
              </div>

              <div className="mt-auto">
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-brand-primary text-surface-base font-black text-brutalist text-sm tracking-widest uppercase transition-all duration-200 active:scale-[0.97] hover:bg-brand-glow shadow-lg shadow-brand-primary/25"
                >
                  Continue
                  <ArrowRight size={16} strokeWidth={3} />
                </button>
              </div>
            </motion.form>
          )}

          {step === "legal" && (
            <motion.form
              key="legal"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleFinish}
              className="relative z-10 flex flex-col gap-6 flex-1"
            >
              <div className="flex flex-col gap-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-primary/15 flex items-center justify-center mb-2">
                  <Shield size={28} className="text-brand-glow" />
                </div>
                <h1 className="text-brutalist text-[clamp(2rem,10vw,3.5rem)] leading-none text-text-primary">
                  ALMOST <span className="text-brand-glow glow-green">DONE</span>
                </h1>
                <p className="text-text-muted text-sm">Just a few confirmations before you play.</p>
              </div>

              <div className="flex flex-col gap-3">
                <CheckItem
                  checked={age}
                  onChange={setAge}
                  label="I confirm I am 18 years of age or older"
                  icon={Shield}
                />
                <CheckItem
                  checked={terms}
                  onChange={setTerms}
                  label={
                    <span>
                      I agree to the{" "}
                      <button type="button" className="text-brand-glow underline" onClick={() => window.open("/terms", "_blank")}>
                        Terms & Conditions
                      </button>
                    </span>
                  }
                  icon={FileCheck}
                />
                <CheckItem
                  checked={privacy}
                  onChange={setPrivacy}
                  label={
                    <span>
                      I agree to the{" "}
                      <button type="button" className="text-brand-glow underline" onClick={() => window.open("/privacy", "_blank")}>
                        Privacy Policy
                      </button>
                    </span>
                  }
                  icon={Lock}
                />
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs px-1 -mt-2">
                  {error}
                </motion.p>
              )}

              <div className="mt-auto flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-brand-primary text-surface-base font-black text-brutalist text-sm tracking-widest uppercase transition-all duration-200 active:scale-[0.97] hover:bg-brand-glow shadow-lg shadow-brand-primary/25 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-surface-base/30 border-t-surface-base rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Claim 1000 Free Bets
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("username"); setError(""); }}
                  className="text-text-muted text-sm text-center hover:text-text-secondary transition-colors"
                >
                  ← Back
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </MobileShell>
  );
}

function CheckItem({
  checked,
  onChange,
  label,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  icon: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 text-left ${
        checked
          ? "border-brand-primary bg-brand-primary/10"
          : "border-border-subtle bg-surface-raised/40"
      }`}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${checked ? "text-brand-glow" : "text-text-muted/50"}`} />
      <span className="flex-1 text-sm text-text-secondary leading-relaxed">{label}</span>
      <CheckCircle2
        size={20}
        className={`shrink-0 mt-0.5 transition-all ${checked ? "text-brand-glow" : "text-text-muted/30"}`}
        strokeWidth={checked ? 2.5 : 1.5}
      />
    </button>
  );
}
