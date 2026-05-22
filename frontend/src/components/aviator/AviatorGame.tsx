"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

function genCrash(): number {
  const r = Math.random();
  return 1.1 + r * r * 9; // skewed low, max ~10x
}

export default function AviatorGame() {
  const [round, setRound] = useState<AviatorRound | null>(null);
  const [balance, setBalance] = useState(100_000);
  const [betId, setBetId] = useState<string | null>(null);
  const [autoMult, setAutoMult] = useState("2.00");
  const [customBet, setCustomBet] = useState("1.00");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Local simulation mode (when backend is unreachable)
  const [localMode, setLocalMode] = useState(false);
  const localBalanceRef = useRef(100_000);
  const localBetRef = useRef<{ id: string; cents: number } | null>(null);

  // 60 FPS Client-Side Prediction State and Refs
  const [displayMult, setDisplayMult] = useState(1.0);
  const [activeBetCents, setActiveBetCents] = useState<number | null>(null);

  const displayMultRef = useRef(1.0);
  const statusRef = useRef("waiting");
  const serverMultRef = useRef(1.0);
  const flightStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const localModeRef = useRef(false);

  // --- Backend Mode ---
  const refresh = useCallback(async () => {
    if (localModeRef.current) return;
    try {
      const [r, b] = await Promise.all([getAviatorRound(), getAviatorBalance()]);
      setRound(r);
      setBalance(b.balance_cents);
    } catch {
      if (!localModeRef.current) {
        localModeRef.current = true;
        setLocalMode(true);
      }
    }
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;

    getAviatorRound()
      .then((r) => {
        setRound(r);
        unsub = subscribeAviatorRound((upd) => setRound(upd));
        interval = setInterval(refresh, 3000);
      })
      .catch(() => {
        localModeRef.current = true;
        setLocalMode(true);
      });

    getAviatorBalance()
      .then((b) => { if (!localModeRef.current) setBalance(b.balance_cents); })
      .catch(() => {});

    return () => {
      unsub?.();
      if (interval) clearInterval(interval);
    };
  }, [refresh]);

  // --- Local Simulation Mode ---
  useEffect(() => {
    if (!localMode) return;

    let phase: "waiting" | "flying" | "crashed" = "waiting";
    let crashAt = 0;
    let phaseStart = Date.now();

    const tick = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - phaseStart) / 1000;

      if (phase === "waiting") {
        setRound({ round_id: "local", status: "waiting", current_multiplier: 1.0, crash_multiplier: 1.0 });
        if (elapsed > 4) {
          phase = "flying";
          crashAt = genCrash();
          phaseStart = now;
        }
      } else if (phase === "flying") {
        const m = Math.exp(0.06 * elapsed);
        setRound({ round_id: "local", status: "flying", current_multiplier: m, crash_multiplier: crashAt });
        if (m >= crashAt) {
          // Crash — lose any active local bet
          if (localBetRef.current) {
            localBetRef.current = null;
            setBetId(null);
            setActiveBetCents(null);
          }
          phase = "crashed";
          phaseStart = now;
          setRound({ round_id: "local", status: "crashed", current_multiplier: crashAt, crash_multiplier: crashAt });
        }
      } else {
        if (elapsed > 3) {
          phase = "waiting";
          phaseStart = now;
        }
      }
    }, 100);

    return () => clearInterval(tick);
  }, [localMode]);

  // Sync server round updates to refs
  useEffect(() => {
    const status = round?.status ?? "waiting";
    const serverMult = round?.current_multiplier ?? 1.0;

    statusRef.current = status;
    serverMultRef.current = serverMult;

    if (status === "waiting") {
      setDisplayMult(1.0);
      displayMultRef.current = 1.0;
      flightStartRef.current = null;
    } else if (status === "crashed") {
      setDisplayMult(serverMult);
      displayMultRef.current = serverMult;
      flightStartRef.current = null;
      if (!localModeRef.current) {
        setBetId(null);
        setActiveBetCents(null);
      }
    }
  }, [round?.status, round?.current_multiplier]);

  // 60 FPS animation loop
  useEffect(() => {
    let active = true;

    const tick = () => {
      if (!active) return;
      const currentStatus = statusRef.current;
      const serverMult = serverMultRef.current;

      if (currentStatus === "flying") {
        if (flightStartRef.current === null) {
          const elapsedSec = Math.log(Math.max(1.0, serverMult)) / 0.06;
          flightStartRef.current = Date.now() - elapsedSec * 1000;
        } else {
          const impliedElapsedSec = Math.log(Math.max(1.0, serverMult)) / 0.06;
          const targetStart = Date.now() - impliedElapsedSec * 1000;
          flightStartRef.current += (targetStart - flightStartRef.current) * 0.1;
        }
        const elapsedMs = Date.now() - flightStartRef.current;
        const predicted = Math.exp(0.06 * (elapsedMs / 1000));
        const finalMult = Math.max(displayMultRef.current, predicted);
        displayMultRef.current = finalMult;
        setDisplayMult(finalMult);
      } else if (currentStatus === "crashed") {
        setDisplayMult(serverMult);
        displayMultRef.current = serverMult;
        flightStartRef.current = null;
      } else {
        setDisplayMult(1.0);
        displayMultRef.current = 1.0;
        flightStartRef.current = null;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // --- Handlers ---
  const handleBet = async (amount: number) => {
    setLoading(true);
    setMessage("");
    try {
      if (localMode) {
        // Local bet
        if (amount > localBalanceRef.current) throw new Error("Недостаточно средств");
        localBalanceRef.current -= amount;
        setBalance(localBalanceRef.current);
        const id = `local-${Date.now()}`;
        localBetRef.current = { id, cents: amount };
        setBetId(id);
        setActiveBetCents(amount);
        setMessage("Ставка принята");
      } else {
        const res = await placeAviatorBet(amount);
        setBetId(res.bet_id);
        setBalance(res.balance_cents);
        setActiveBetCents(amount);
        const mult = parseFloat(autoMult);
        if (mult >= 1.01) await setAviatorAutoCashout(res.bet_id, mult);
        setMessage("Ставка принята");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка ставки");
    } finally {
      setLoading(false);
    }
  };

  const handleCashOut = async () => {
    if (!betId) return;
    setLoading(true);
    try {
      if (localMode) {
        if (!localBetRef.current) return;
        const mult = displayMultRef.current;
        const payout = Math.round(localBetRef.current.cents * mult);
        localBalanceRef.current += payout;
        setBalance(localBalanceRef.current);
        setMessage(`Выведено ${mult.toFixed(2)}x — +${formatCredits(payout)}`);
        localBetRef.current = null;
        setBetId(null);
        setActiveBetCents(null);
      } else {
        const res = await cashOutAviator(betId);
        setBalance(res.balance_cents);
        setMessage(`Выведено ${res.multiplier.toFixed(2)}x — +${formatCredits(res.payout_cents)}`);
        setBetId(null);
        setActiveBetCents(null);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка вывода");
    } finally {
      setLoading(false);
    }
  };

  const canBet = round?.status === "waiting";
  const canCashOut = round?.status === "flying" && !!betId;

  return (
    <div className="relative w-full h-[calc(100svh-4rem)] overflow-hidden bg-surface-base">
      <AviatorCanvas multiplier={displayMult} status={round?.status ?? "waiting"} />

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
            key={round?.status ?? "waiting"}
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
              {displayMult.toFixed(2)}x
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
            {canCashOut
              ? activeBetCents
                ? `Cash Out x${displayMult.toFixed(2)} (${formatCredits(activeBetCents * displayMult)})`
                : `Cash Out x${displayMult.toFixed(2)}`
              : "Cash Out"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
