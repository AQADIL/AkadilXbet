"use client";

import { motion } from "framer-motion";
import { ChessPawn, Lock, Flag } from "lucide-react";

interface LevelMapProps {
  unlockedLevel: number;
  selectedLevel: number;
  onSelect: (level: number) => void;
}

const LEVEL_POINTS = [
  { x: 24, y: 74 },
  { x: 50, y: 28 },
  { x: 76, y: 74 },
  { x: 50, y: 44 },
  { x: 24, y: 28 },
];

export default function LevelMap({ unlockedLevel, selectedLevel, onSelect }: LevelMapProps) {
  const pawnPoint = LEVEL_POINTS[Math.max(0, Math.min(selectedLevel - 1, LEVEL_POINTS.length - 1))];

  return (
    <div className="relative w-full max-w-md mx-auto rounded-3xl border border-white/15 bg-[#112A18]/55 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/45 text-[10px] uppercase tracking-[0.3em] font-semibold">
          Ranked Hand Path
        </span>
        <span className="text-green-300/80 text-xs font-black tabular-nums">
          {unlockedLevel}/5
        </span>
      </div>

      <div className="relative w-full aspect-[4/3] rounded-2xl bg-[#08140C]/80 border border-white/10 overflow-hidden">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="path-glow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(74,222,128,0.75)" />
              <stop offset="100%" stopColor="rgba(74,222,128,0.2)" />
            </linearGradient>
          </defs>

          {LEVEL_POINTS.slice(0, -1).map((point, idx) => {
            const next = LEVEL_POINTS[idx + 1];
            return (
              <line
                key={`line-${idx}`}
                x1={point.x}
                y1={point.y}
                x2={next.x}
                y2={next.y}
                stroke="url(#path-glow)"
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.7}
              />
            );
          })}
        </svg>

        <motion.div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          animate={{ left: `${pawnPoint.x}%`, top: `${pawnPoint.y}%`, y: [0, -8, 0] }}
          transition={{
            left: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
            top: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
            y: { duration: 0.8, ease: "easeInOut" },
          }}
        >
          <div className="w-12 h-12 rounded-2xl border border-emerald-300/70 bg-emerald-400/20 backdrop-blur-md flex items-center justify-center shadow-[0_0_24px_rgba(74,222,128,0.35)]">
            <ChessPawn size={24} className="text-emerald-200" />
          </div>
        </motion.div>

        {LEVEL_POINTS.map((point, idx) => {
          const level = idx + 1;
          const unlocked = level <= unlockedLevel;
          const selected = level === selectedLevel;

          return (
            <button
              key={`lvl-${level}`}
              type="button"
              onClick={() => unlocked && onSelect(level)}
              disabled={!unlocked}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              <div
                className={`w-11 h-11 rounded-xl border backdrop-blur-md flex items-center justify-center transition-all duration-200 ${
                  unlocked
                    ? selected
                      ? "bg-emerald-400/25 border-emerald-300/70 shadow-[0_0_20px_rgba(74,222,128,0.35)]"
                      : "bg-white/10 border-white/25"
                    : "bg-white/5 border-white/10 opacity-70"
                }`}
              >
                {unlocked ? (
                  level === 5 ? (
                    <Flag size={18} className="text-emerald-200" />
                  ) : (
                    <span className="text-xs font-black text-white/85">{level}</span>
                  )
                ) : (
                  <Lock size={16} className="text-white/40" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
