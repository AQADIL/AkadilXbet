"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";

const TRUST_BADGES = [
  { icon: Shield, label: "Licensed & Regulated" },
  { icon: TrendingUp, label: "Live Odds" },
] as const;

export default function HeroSection() {
  return (
    <section className="relative min-h-[calc(100svh-4rem)] flex flex-col justify-between px-4 pt-12 pb-8 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-primary/8 blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-64 h-64 rounded-full bg-brand-glow/5 blur-3xl" />
        <div className="absolute bottom-24 right-8 w-48 h-48 rounded-full bg-brand-primary/6 blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-semibold text-brand-glow uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-glow opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-glow" />
            </span>
            Welcome Offer
          </span>

          <h1 className="text-brutalist-xl text-[clamp(3.5rem,14vw,6rem)] leading-none text-text-primary">
            <span className="block">1000</span>
            <span className="block text-brand-glow glow-green">FREE</span>
            <span className="block">BETS</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-text-secondary text-base font-medium leading-relaxed max-w-xs"
        >
          New players receive{" "}
          <span className="text-text-gold font-bold">1,000 free bet credits</span>{" "}
          on first deposit. No cap. No games.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-3 pt-2"
        >
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-brand-primary text-surface-base font-black text-brutalist text-sm tracking-widest uppercase transition-all duration-200 active:scale-[0.97] hover:bg-brand-glow shadow-lg shadow-brand-primary/25"
          >
            Claim Now
            <ArrowRight size={16} strokeWidth={3} />
          </Link>

          <Link
            href="/login"
            className="flex items-center justify-center w-full h-12 rounded-xl glass border border-glass text-text-secondary font-semibold text-sm uppercase tracking-widest transition-all duration-200 active:scale-[0.97] hover:text-text-primary"
          >
            Sign In
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 flex items-center gap-4 mt-8"
      >
        {TRUST_BADGES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-3 py-2 rounded-lg glass"
          >
            <Icon size={14} className="text-brand-glow shrink-0" />
            <span className="text-xs text-text-muted font-medium whitespace-nowrap">
              {label}
            </span>
          </div>
        ))}

        <p className="ml-auto text-[10px] text-text-muted text-right leading-tight max-w-[120px]">
          T&Cs apply.{"\n"}18+ only.
        </p>
      </motion.div>
    </section>
  );
}
