"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, LogOut, Shield, Trophy, Wallet, ChevronRight, Target, TrendingUp, Coins, Zap } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  if (!user) return null;

  const displayName = user.username || user.email.split("@")[0];

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <MobileShell>
      <div className="relative flex flex-col px-4 pt-10 pb-24 gap-6 min-h-[calc(100svh-4rem)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-primary/8 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center gap-3 pt-4"
        >
          <div className="w-20 h-20 rounded-full bg-brand-primary/20 border-2 border-brand-primary/40 flex items-center justify-center">
            <span className="text-3xl font-black text-brand-glow text-brutalist uppercase">
              {displayName[0]}
            </span>
          </div>
          <div className="text-center">
            <h1 className="text-brutalist text-2xl text-text-primary">{displayName}</h1>
            <p className="text-text-muted text-sm">{user.email}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-brand-primary/15 text-brand-glow text-xs font-semibold uppercase tracking-widest">
            Active Player
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 grid grid-cols-2 gap-3"
        >
          <StatCard icon={Target} label="Bets Placed" value="0" />
          <StatCard icon={TrendingUp} label="Win Rate" value="—" />
          <StatCard icon={Coins} label="Total Won" value="0" />
          <StatCard icon={Zap} label="Free Bets" value="1,000" highlight />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col gap-2"
        >
          <p className="text-xs text-text-muted font-semibold uppercase tracking-widest px-1">Account</p>
          <div className="glass rounded-2xl overflow-hidden divide-y divide-border-subtle">
            <MenuRow icon={<User size={16} />} label="Edit Profile" onClick={() => router.push("/profile/edit")} />
            <MenuRow icon={<Wallet size={16} />} label="Wallet & Deposits" onClick={() => router.push("/wallet")} />
            <MenuRow icon={<Trophy size={16} />} label="My Bets" onClick={() => {}} />
            <MenuRow icon={<Shield size={16} />} label="Responsible Gambling" onClick={() => {}} />
            <MenuRow icon={<Mail size={16} />} label="Support" onClick={() => {}} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative z-10 mt-auto"
        >
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full h-13 rounded-xl glass border border-red-500/20 text-red-400 font-semibold text-sm uppercase tracking-widest transition-all active:scale-[0.97] hover:border-red-500/40"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </motion.div>
      </div>
    </MobileShell>
  );
}

function StatCard({ icon: Icon, label, value, highlight }: { icon: React.ElementType; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-4 flex flex-col gap-2 ${highlight ? "border border-brand-primary/30" : ""}`}>
      <Icon size={18} className={highlight ? "text-brand-glow" : "text-text-muted"} />
      <p className={`text-brutalist text-xl font-black ${highlight ? "text-brand-glow" : "text-text-primary"}`}>{value}</p>
      <p className="text-text-muted text-xs font-medium">{label}</p>
    </div>
  );
}

function MenuRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-4 w-full text-left hover:bg-surface-overlay/50 transition-colors"
    >
      <span className="text-text-muted">{icon}</span>
      <span className="text-text-secondary text-sm font-medium flex-1">{label}</span>
      <ChevronRight size={14} className="text-text-muted/50" />
    </button>
  );
}
