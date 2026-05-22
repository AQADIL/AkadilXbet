"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, TrendingUp } from "lucide-react";
import AviatorCanvas from "@/components/aviator/AviatorCanvas";
import {
  cashOutAviator,
  formatCredits,
  getAviatorBalance,
  getAviatorRound,
  placeAviatorBet,
  setAviatorAutoCashout,
  subscribeAviatorRound,
  type AviatorRound,
} from "@/lib/gameApi";

const BET_PRESETS = [100, 500, 1000, 2500];

export default function AviatorGame() {
  const [round, setRound] = useState<AviatorRound | null>(null);
  const [balance, setBalance] = useState(100_000);
  const [betId, setBetId] = useState<string | null>(null);
  const [autoMult, setAutoMult] = useState("2.00");
  const [customBet, setCustomBet] = useState("1.00");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [r, b] = await Promise.all([getAviatorRound(), getAviatorBalance()]);
      setRound(r);
      setBalance(b.balance_cents);
    } catch {
      /* backend may be offline */
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribeAviatorRound((r) => setRound(r));
    const id = setInterval(refresh, 3000);
    return () => {
      unsub();
      clearInterval(id);
    };
  }, [refresh]);

  const handleBet = async (amount: number) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await placeAviatorBet(amount);
      setBetId(res.bet_id);
      setBalance(res.balance_cents);
      const mult = parseFloat(autoMult);
      if (mult >= 1.01) {
        await setAviatorAutoCashout(res.bet_id, mult);
      }
      setMessage("Bet placed");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Bet failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCashOut = async () => {
    if (!betId) return;
    setLoading(true);
    try {
      const res = await cashOutAviator(betId);
      setBalance(res.balance_cents);
      setMessage(`Cashed out ${res.multiplier.toFixed(2)}x — +${formatCredits(res.payout_cents)}`);
      setBetId(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Cash out failed");
    } finally {
      setLoading(false);
    }
  };

  const mult = round?.current_multiplier ?? 1;
  const canBet = round?.status === "waiting";
  const canCashOut = round?.status === "flying" && betId;

  return (
    <div className="relative w-full h-[calc(100svh-4rem)] overflow-hidden bg-surface-base">
      <AviatorCanvas multiplier={mult} status={round?.status ?? "waiting"} />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(34,197,94,0.12) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full">
            <Plane size={14} className="text-brand-glow" />
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
              Aviator
            </span>
          </div>
          <div className="glass px-3 py-1.5 rounded-full">
            <span className="text-xs text-text-gold font-bold tabular-nums">
              {formatCredits(balance)}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <motion.div
            key={mult}
            initial={{ scale: 0.92, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-text-muted mb-1">
              {round?.status ?? "…"}
            </p>
            <p
              className={`text-brutalist-xl text-[clamp(3rem,18vw,5.5rem)] tabular-nums ${
                round?.status === "crashed" ? "text-red-400" : "text-brand-glow glow-green"
              }`}
            >
              {mult.toFixed(2)}x
            </p>
          </motion.div>
        </div>

        <div className="px-4 pb-6 flex flex-col gap-3">
          <AnimatePresence>
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-xs text-text-secondary glass rounded-lg py-2"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="glass rounded-xl p-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-glow shrink-0" />
            <label className="text-[10px] uppercase tracking-wider text-text-muted">Auto @</label>
            <input
              type="number"
              step="0.1"
              min="1.01"
              value={autoMult}
              onChange={(e) => setAutoMult(e.target.value)}
              className="flex-1 bg-transparent text-brand-glow font-bold text-sm outline-none"
            />
            <span className="text-text-muted text-xs">x</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {BET_PRESETS.map((amt) => (
              <motion.button
                key={amt}
                whileTap={{ scale: 0.96 }}
                disabled={!canBet || loading}
                onClick={() => handleBet(amt)}
                className="h-11 rounded-xl glass text-xs font-bold text-text-secondary uppercase disabled:opacity-40 hover:text-brand-glow"
              >
                {amt / 100}
              </motion.button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={customBet}
              onChange={(e) => setCustomBet(e.target.value)}
              className="flex-1 h-11 rounded-xl glass px-3 text-sm font-bold text-brand-glow outline-none"
              placeholder="Amount"
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={!canBet || loading}
              onClick={() => {
                const val = parseFloat(customBet || "0") || 0;
                handleBet(Math.max(1, Math.round(val * 100)));
              }}
              className="h-11 rounded-xl bg-brand-primary text-surface-base font-black text-sm tracking-widest uppercase disabled:opacity-40"
            >
              Bet
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!canCashOut || loading}
            onClick={handleCashOut}
            className="h-14 rounded-xl bg-brand-primary text-surface-base font-black text-brutalist text-sm tracking-widest uppercase disabled:opacity-40 shadow-lg shadow-brand-primary/20"
          >
            Cash Out
          </motion.button>
        </div>
      </div>
    </div>
  );
}
