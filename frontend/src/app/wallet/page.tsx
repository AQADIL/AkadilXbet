"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Wallet, Plus, Minus } from "lucide-react";
import MobileShell from "@/components/layout/MobileShell";
import { useAuth } from "@/context/AuthContext";
import { authFetch, WalletDTO, WalletTransactionDTO } from "@/lib/auth";

type TxType = "deposit" | "withdrawal" | "bet" | "win" | "bonus";

interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  description: string;
  date: string;
}

const TX_META: Record<TxType, { label: string; color: string; bg: string; icon: React.ElementType; sign: "+" | "-" }> = {
  deposit:    { label: "Deposit",    color: "text-brand-glow",  bg: "bg-brand-glow/10",   icon: ArrowDownLeft,  sign: "+" },
  bonus:      { label: "Bonus",      color: "text-brand-glow",  bg: "bg-brand-glow/10",   icon: Plus,           sign: "+" },
  win:        { label: "Win",        color: "text-brand-glow",  bg: "bg-brand-glow/10",   icon: ArrowDownLeft,  sign: "+" },
  bet:        { label: "Bet",        color: "text-text-muted",  bg: "bg-surface-overlay", icon: Minus,          sign: "-" },
  withdrawal: { label: "Withdrawal", color: "text-red-400",     bg: "bg-red-500/10",      icon: ArrowUpRight,   sign: "-" },
};

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<TxType | "all">("all");
  const [balanceCents, setBalanceCents] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    (async () => {
      try {
        const [walletRes, txRes] = await Promise.all([
          authFetch("/api/auth/wallet"),
          authFetch("/api/auth/wallet/transactions?limit=100"),
        ]);

        if (walletRes.ok) {
          const walletData = (await walletRes.json()) as WalletDTO;
          if (mounted) setBalanceCents(walletData.balance_cents);
        }

        if (txRes.ok) {
          const txData = (await txRes.json()) as { items: WalletTransactionDTO[] };
          const mapped = txData.items.map((t) => ({
            id: t.id,
            type: t.type,
            amount: Math.floor(t.amount_cents / 100),
            description: t.description,
            date: new Date(t.created_at * 1000).toLocaleString(),
          }));
          if (mounted) setTransactions(mapped);
        }
      } catch {
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) return null;

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

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
          <h1 className="text-brutalist text-xl text-text-primary">Wallet</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 glass rounded-2xl p-5 flex flex-col gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
              <Wallet size={18} className="text-brand-glow" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Total Balance</p>
              <p className="text-brutalist text-3xl font-black text-text-primary">
                {Math.floor(balanceCents / 100).toLocaleString()} <span className="text-brand-glow text-xl">KZT</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 h-11 rounded-xl bg-brand-primary text-surface-base font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.97] hover:bg-brand-glow">
              Deposit
            </button>
            <button className="flex-1 h-11 rounded-xl glass border border-border-subtle text-text-secondary font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.97] hover:border-brand-glow/30 hover:text-text-primary">
              Withdraw
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col gap-3"
        >
          <p className="text-xs text-text-muted font-semibold uppercase tracking-widest">Transaction History</p>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(["all", "deposit", "withdrawal", "bet", "win", "bonus"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  filter === f
                    ? "bg-brand-primary text-surface-base"
                    : "glass text-text-muted hover:text-text-secondary"
                }`}
              >
                {f === "all" ? "All" : TX_META[f].label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {filtered.length === 0 && (
              <p className="text-text-muted text-sm text-center py-8">No transactions yet</p>
            )}
            {filtered.map((tx, i) => {
              const meta = TX_META[tx.type];
              const Icon = meta.icon;
              const positive = tx.amount > 0;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="glass rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={16} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-text-muted text-xs">{tx.date}</p>
                  </div>
                  <span className={`text-sm font-black text-brutalist shrink-0 ${positive ? "text-brand-glow" : "text-text-secondary"}`}>
                    {positive ? "+" : ""}{tx.amount.toLocaleString()}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </MobileShell>
  );
}
