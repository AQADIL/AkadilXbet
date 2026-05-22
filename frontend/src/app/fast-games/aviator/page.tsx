"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MobileShell from "@/components/layout/MobileShell";
import { useBalance } from "@/hooks/useBalance";
import { getAviatorCrashPoint } from "@/lib/rtp";

type Phase = "BETTING" | "FLYING" | "CASHED_OUT" | "CRASHED";

const STARS = Array.from({ length: 28 }, (_, i) => ({
  x: ((i * 97 + 13) % 100),
  y: ((i * 71 + 37) % 80),
  r: (i % 3) * 0.5 + 0.5,
  op: ((i * 31 + 7) % 10) * 0.06 + 0.12,
}));

const GW = 300;
const GH = 180;
const GROWTH = 0.07;

function calcMult(ms: number) {
  return Math.pow(Math.E, GROWTH * (ms / 1000));
}
function multToY(m: number, max = 12) {
  return GH - Math.min((m - 1) / (max - 1), 1) * GH * 0.85;
}
function msToX(ms: number, maxMs = 38000) {
  return Math.min((ms / maxMs) * GW, GW - 2);
}

const BET_PRESETS = [10, 25, 50, 100, 200];

export default function AviatorPage() {
  const { balance, placeBet, addWinnings } = useBalance();
  const [phase, setPhase] = useState<Phase>("BETTING");
  const [betAmount, setBetAmount] = useState(50);
  const [autoCashoutInput, setAutoCashoutInput] = useState("");
  const [mult, setMult] = useState(1.0);
  const [pathD, setPathD] = useState(`M 0 ${GH}`);
  const [planePt, setPlanePt] = useState({ x: 0, y: GH });
  const [cashedAt, setCashedAt] = useState<number | null>(null);

  const rafRef = useRef<number>(0);
  const betRef = useRef(50);
  const crashRef = useRef(2.0);
  const autoRef = useRef<number | null>(null);
  const t0Ref = useRef(0);
  const ptsRef = useRef<[number, number][]>([[0, GH]]);
  const multRef = useRef(1.0);
  const phaseRef = useRef<Phase>("BETTING");

  const startFlight = () => {
    const bet = Math.min(betAmount, balance);
    if (!placeBet(bet)) return;

    betRef.current = bet;
    crashRef.current = getAviatorCrashPoint(balance - bet);
    autoRef.current = autoCashoutInput ? parseFloat(autoCashoutInput) : null;
    ptsRef.current = [[0, GH]];
    setPathD(`M 0 ${GH}`);
    setPlanePt({ x: 0, y: GH });
    setMult(1.0);
    multRef.current = 1.0;
    setCashedAt(null);
    setPhase("FLYING");
    phaseRef.current = "FLYING";
    t0Ref.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - t0Ref.current;
      const m = calcMult(elapsed);
      multRef.current = m;
      setMult(m);

      const x = msToX(elapsed);
      const y = multToY(m);
      ptsRef.current.push([x, y]);
      if (ptsRef.current.length > 180) ptsRef.current = ptsRef.current.slice(-140);

      const d = ptsRef.current
        .map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`)
        .join(" ");
      setPathD(d);
      setPlanePt({ x, y });

      const auto = autoRef.current;
      if (auto && m >= auto) {
        cancelAnimationFrame(rafRef.current);
        const win = Math.floor(betRef.current * m);
        addWinnings(win);
        setCashedAt(m);
        setPhase("CASHED_OUT");
        phaseRef.current = "CASHED_OUT";
        return;
      }
      if (m >= crashRef.current) {
        setMult(crashRef.current);
        setPhase("CRASHED");
        phaseRef.current = "CRASHED";
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const cashOut = () => {
    if (phaseRef.current !== "FLYING") return;
    cancelAnimationFrame(rafRef.current);
    const m = multRef.current;
    const win = Math.floor(betRef.current * m);
    addWinnings(win);
    setCashedAt(m);
    setPhase("CASHED_OUT");
    phaseRef.current = "CASHED_OUT";
  };

  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    ptsRef.current = [[0, GH]];
    setPathD(`M 0 ${GH}`);
    setPlanePt({ x: 0, y: GH });
    setMult(1.0);
    setCashedAt(null);
    setPhase("BETTING");
    phaseRef.current = "BETTING";
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const isCrashed = phase === "CRASHED";
  const isCashedOut = phase === "CASHED_OUT";
  const isFlying = phase === "FLYING";

  const multColor = isCrashed ? "#f87171" : isCashedOut ? "#fbbf24" : "#4ade80";
  const lineColor = isCrashed ? "#f87171" : "#4ade80";
  const fillD = `${pathD} L ${planePt.x.toFixed(1)} ${GH} L 0 ${GH} Z`;

  return (
    <MobileShell flush>
      <div className="flex flex-col min-h-svh bg-[#05100A]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-2 shrink-0">
          <Link href="/fast-games" className="p-1 text-text-muted hover:text-text-secondary transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13 16L7 10L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <span className="text-text-muted text-[11px] uppercase tracking-[0.3em] font-bold">Aviator</span>
          <div className="ml-auto text-text-gold text-xs font-bold">{balance} cr</div>
        </div>

        {/* Graph */}
        <div className="relative flex-1 min-h-[220px] overflow-hidden">
          {/* Stars */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice">
            {STARS.map((s, i) => (
              <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.op} />
            ))}
          </svg>

          {/* Game graph */}
          <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${GW} ${GH}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="avFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
              </linearGradient>
              <filter id="avGlow">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <path d={fillD} fill="url(#avFill)" />
            <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" filter="url(#avGlow)" />
            {!isCrashed && (
              <g transform={`translate(${planePt.x}, ${planePt.y - 14})`}>
                <text fontSize="20" textAnchor="middle" dominantBaseline="middle">✈</text>
              </g>
            )}
            {isCrashed && (
              <g transform={`translate(${planePt.x}, ${planePt.y})`}>
                <text fontSize="26" textAnchor="middle" dominantBaseline="middle">💥</text>
              </g>
            )}
          </svg>

          {/* Multiplier */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div
                className="font-black tabular-nums leading-none select-none"
                style={{
                  fontSize: "clamp(3.5rem, 16vw, 5.5rem)",
                  color: multColor,
                  textShadow: `0 0 40px ${multColor}55, 0 0 80px ${multColor}25`,
                }}
              >
                {mult.toFixed(2)}x
              </div>
              {isCashedOut && (
                <div className="text-text-gold text-sm font-bold mt-2 uppercase tracking-wider">
                  +{Math.floor(betRef.current * (cashedAt ?? 1))} credits
                </div>
              )}
              {isCrashed && (
                <div className="text-red-400 text-sm font-bold mt-2 uppercase tracking-widest">Crashed</div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isCashedOut && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full glass border border-text-gold/40 text-text-gold text-xs font-black uppercase tracking-widest whitespace-nowrap"
              >
                Cashed out at {cashedAt?.toFixed(2)}×
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="shrink-0 px-4 pb-8 pt-3 space-y-3">
          <AnimatePresence mode="wait">
            {phase === "BETTING" && (
              <motion.div key="betting" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-3">
                <div className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-muted text-[10px] uppercase tracking-widest font-bold">Bet</span>
                    <span className="text-text-gold text-xs font-bold">{betAmount} cr</span>
                  </div>
                  <div className="flex gap-2">
                    {BET_PRESETS.map((amt) => (
                      <button key={amt} onClick={() => setBetAmount(amt)}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                          betAmount === amt
                            ? "bg-brand-primary/20 border border-brand-primary/50 text-brand-glow"
                            : "bg-white/5 text-text-muted border border-transparent"
                        }`}>
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-xl p-3 flex items-center gap-3">
                  <span className="text-text-muted text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">Auto ×</span>
                  <input
                    type="number"
                    placeholder="e.g. 2.00"
                    value={autoCashoutInput}
                    onChange={(e) => setAutoCashoutInput(e.target.value)}
                    className="flex-1 bg-transparent text-text-primary text-sm font-semibold text-right outline-none placeholder:text-text-muted/50 min-w-0"
                    min="1.1" step="0.1"
                  />
                  {autoCashoutInput && (
                    <button onClick={() => setAutoCashoutInput("")} className="text-text-muted hover:text-text-secondary text-xs">✕</button>
                  )}
                </div>

                <button onClick={startFlight} disabled={balance < betAmount}
                  className="h-14 w-full rounded-xl bg-brand-primary text-surface-base font-black uppercase tracking-widest text-sm shadow-lg shadow-brand-primary/25 disabled:opacity-40 active:scale-[0.97] transition-transform">
                  Fly — {betAmount} credits
                </button>
              </motion.div>
            )}

            {isFlying && (
              <motion.div key="flying" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={cashOut}
                  className="h-16 w-full rounded-xl border border-text-gold/50 text-text-gold font-black uppercase tracking-widest text-base"
                  style={{ background: "rgba(251,191,36,0.12)" }}
                  animate={{ boxShadow: ["0 0 16px rgba(251,191,36,0.15)", "0 0 32px rgba(251,191,36,0.40)", "0 0 16px rgba(251,191,36,0.15)"] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  Cash Out × {mult.toFixed(2)}
                  <div className="text-xs font-semibold opacity-70 mt-0.5 normal-case">
                    = {Math.floor(betRef.current * mult)} credits
                  </div>
                </motion.button>
              </motion.div>
            )}

            {(isCrashed || isCashedOut) && (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={reset}
                  className="h-14 w-full rounded-xl glass border border-glass text-text-secondary font-black uppercase tracking-widest text-sm active:scale-[0.97] transition-transform">
                  Play Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MobileShell>
  );
}
