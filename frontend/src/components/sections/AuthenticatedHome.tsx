"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronRight, Layers, Zap, Timer, Dices } from "lucide-react";
import Link from "next/link";
import { authFetch, AuthUser, WalletDTO } from "@/lib/auth";

const GREETINGS = [
  "Hello",
  "Привет",
  "Bonjour",
  "Hola",
  "Merhaba",
  "こんにちは",
  "مرحبا",
  "Ciao",
  "Olá",
  "안녕하세요",
  "Hej",
  "Xin chào",
];

export default function AuthenticatedHome({ user }: { user: AuthUser }) {
  const [greetIdx, setGreetIdx] = useState(0);
  const [balanceCents, setBalanceCents] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreetIdx((i) => (i + 1) % GREETINGS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await authFetch("/api/auth/wallet");
        if (!res.ok) return;
        const data = (await res.json()) as WalletDTO;
        if (mounted) setBalanceCents(data.balance_cents);
      } catch {
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const displayName = user.username || user.email.split("@")[0];

  return (
    <section className="relative min-h-[calc(100svh-4rem)] flex flex-col px-4 pt-10 pb-8 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-primary/8 blur-3xl" />
        <div className="absolute bottom-24 -left-16 w-64 h-64 rounded-full bg-brand-glow/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-1"
        >
          <div className="flex items-center gap-2 h-10 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={greetIdx}
                initial={{ rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: 90, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-brutalist text-3xl text-brand-glow glow-green block"
                style={{ transformOrigin: "center center", perspective: "600px" }}
              >
                {GREETINGS[greetIdx]},
              </motion.span>
            </AnimatePresence>
            <span className="text-brutalist text-3xl text-text-primary truncate max-w-[180px]">
              {displayName}
            </span>
          </div>
          <p className="text-text-muted text-sm font-medium">Ready to place some bets?</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-2xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
              <Wallet size={18} className="text-brand-glow" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Balance</p>
              <p className="text-text-primary font-black text-xl text-brutalist">
                {balanceCents === null ? "..." : Math.floor(balanceCents / 100).toLocaleString()} <span className="text-brand-glow text-base">KZT</span>
              </p>
            </div>
          </div>
          <Link
            href="/wallet"
            className="flex items-center gap-1 text-xs text-brand-glow font-semibold uppercase tracking-wider"
          >
            Deposit <ChevronRight size={14} />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-3"
        >
          <p className="text-xs text-text-muted font-semibold uppercase tracking-widest">Quick Play</p>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_GAMES.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="glass rounded-2xl p-4 flex flex-col gap-3 active:scale-[0.97] transition-transform"
              >
                <g.icon size={20} className="text-brand-glow" />
                <div>
                  <p className="text-text-primary font-bold text-sm">{g.label}</p>
                  <p className="text-text-muted text-xs">{g.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}

const QUICK_GAMES = [
  { href: "/blackjack", label: "BlackJack", sub: "Classic card game", icon: Layers },
  { href: "/fast-games", label: "Fast Games", sub: "Quick wins", icon: Zap },
  { href: "/247", label: "24/7 Betting", sub: "Always open", icon: Timer },
  { href: "/casino", label: "Casino", sub: "Slots & more", icon: Dices },
];
