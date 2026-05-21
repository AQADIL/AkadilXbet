"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, User, AtSign } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import { useAuth } from "@/context/AuthContext";
import { authFetch, updateUser } from "@/lib/auth";

export default function EditProfilePage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    setUsername(user.username || "");
  }, [user, router]);

  if (!user) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (username.trim().length < 2) {
      setError("Username must be at least 2 characters");
      return;
    }
    if (username.trim().length > 30) {
      setError("Username must be under 30 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Failed to save profile");
        return;
      }

      const data = await res.json().catch(() => ({}));
      updateUser({ username: username.trim() });
      updateUser({ username: data.username ?? username.trim(), onboardingDone: data.onboarding_done ?? true });
      refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobileShell>
      <div className="relative flex flex-col px-4 pt-6 pb-24 gap-6 min-h-[calc(100svh-4rem)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-primary/8 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 flex items-center gap-3"
        >
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-brutalist text-xl text-text-primary">Edit Profile</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center gap-3 pt-2"
        >
          <div className="w-20 h-20 rounded-full bg-brand-primary/20 border-2 border-brand-primary/40 flex items-center justify-center">
            <span className="text-3xl font-black text-brand-glow text-brutalist uppercase">
              {(username || user.email)[0].toUpperCase()}
            </span>
          </div>
          <p className="text-text-muted text-xs">{user.email}</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={handleSave}
          className="relative z-10 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <User size={12} />
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your display name"
              maxLength={30}
              autoComplete="nickname"
              className="w-full h-13 px-4 rounded-xl glass text-text-primary text-base placeholder:text-text-muted/50 outline-none border border-transparent focus:border-brand-glow/40 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
              <AtSign size={12} />
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full h-13 px-4 rounded-xl glass text-text-muted/60 text-base cursor-not-allowed border border-transparent"
            />
            <p className="text-text-muted/50 text-xs px-1">Email cannot be changed</p>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs px-1 -mt-2">
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`flex items-center justify-center gap-2 w-full h-14 rounded-xl font-black text-brutalist text-sm tracking-widest uppercase transition-all duration-300 active:scale-[0.97] shadow-lg ${
              saved
                ? "bg-brand-glow text-surface-base shadow-brand-glow/25"
                : "bg-brand-primary text-surface-base hover:bg-brand-glow shadow-brand-primary/25"
            } disabled:opacity-50`}
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-surface-base/30 border-t-surface-base rounded-full animate-spin" />
            ) : saved ? (
              "Saved!"
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </motion.form>
      </div>
    </MobileShell>
  );
}
