"use client";

import { motion } from "framer-motion";
import { Crown, Lock, Play, Sparkles } from "lucide-react";

interface LevelMapProps {
  unlockedLevel: number;
  selectedLevel: number;
  onSelect: (level: number) => void;
  onStart: (level: number) => void;
}

const LEVELS = [
  { level: 1, x: 18, y: 78, label: "21" },
  { level: 2, x: 36, y: 60, label: "20" },
  { level: 3, x: 58, y: 45, label: "A" },
  { level: 4, x: 42, y: 28, label: "18" },
  { level: 5, x: 72, y: 16, label: "B" },
];

export default function LevelMap({ unlockedLevel, selectedLevel, onSelect, onStart }: LevelMapProps) {
  const selected = LEVELS.find((item) => item.level === selectedLevel) ?? LEVELS[0];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#08140C] shadow-2xl">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#112A18_0%,#08140C_45%,#15351F_100%)]" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_25%,rgba(74,222,128,0.35),transparent_30%),radial-gradient(circle_at_75%_15%,rgba(250,204,21,0.22),transparent_24%),radial-gradient(circle_at_60%_80%,rgba(34,197,94,0.24),transparent_30%)]" />

      <div className="absolute inset-0 rotate-45 scale-150 opacity-[0.08]">
        <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
          {Array.from({ length: 64 }).map((_, idx) => (
            <div
              key={idx}
              className={idx % 2 === 0 ? "bg-white" : "bg-transparent"}
            />
          ))}
        </div>
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M 18 78 C 25 68, 28 67, 36 60 S 52 50, 58 45 S 50 34, 42 28 S 63 18, 72 16"
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 18 78 C 25 68, 28 67, 36 60 S 52 50, 58 45 S 50 34, 42 28 S 63 18, 72 16"
          fill="none"
          stroke="rgba(74,222,128,0.55)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="2 6"
        />
      </svg>

      <motion.div
        className="absolute z-20 -translate-x-1/2 -translate-y-[120%]"
        animate={{ left: `${selected.x}%`, top: `${selected.y}%`, y: [0, -12, 0] }}
        transition={{
          left: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
          top: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
          y: { duration: 0.85, ease: "easeInOut" },
        }}
      >
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200/80 bg-emerald-300 shadow-[0_14px_35px_rgba(0,0,0,0.35),0_0_34px_rgba(74,222,128,0.55)]">
          <Crown size={25} className="text-[#08140C]" strokeWidth={2.8} />
          <span className="absolute -bottom-5 rounded-full border border-emerald-300/40 bg-[#08140C]/80 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-200 backdrop-blur-md">
            You
          </span>
        </div>
      </motion.div>

      {LEVELS.map((item) => {
        const unlocked = item.level <= unlockedLevel;
        const isSelected = item.level === selectedLevel;

        return (
          <button
            key={item.level}
            type="button"
            disabled={!unlocked}
            onClick={() => {
              if (!unlocked) return;
              onSelect(item.level);
              onStart(item.level);
            }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            <motion.div
              whileTap={unlocked ? { scale: 0.92 } : undefined}
              animate={isSelected ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={isSelected ? { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : { duration: 0.2 }}
              className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border shadow-xl transition-all duration-200 ${
                unlocked
                  ? isSelected
                    ? "border-emerald-200 bg-emerald-300 text-[#08140C] shadow-[0_0_34px_rgba(74,222,128,0.55)]"
                    : "border-white/30 bg-white/15 text-white backdrop-blur-md"
                  : "border-white/10 bg-black/25 text-white/35 backdrop-blur-md"
              }`}
            >
              <div className="absolute -inset-1 rounded-[1.35rem] border border-white/10" />
              {unlocked ? (
                item.level === 5 ? (
                  <Sparkles size={22} strokeWidth={2.7} />
                ) : (
                  <span className="text-lg font-black tracking-tight">{item.label}</span>
                )
              ) : (
                <Lock size={20} />
              )}
              <span className={`absolute -bottom-5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${isSelected ? "bg-emerald-300 text-[#08140C]" : "bg-black/45 text-white/55"}`}>
                L{item.level}
              </span>
            </motion.div>
          </button>
        );
      })}

      <div className="absolute left-5 top-5 z-30 flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/40">
          BlackJack Road
        </span>
        <span className="text-3xl font-black uppercase leading-none text-white drop-shadow-xl">
          Level Up
        </span>
      </div>

      <div className="absolute bottom-5 right-5 z-30 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-right backdrop-blur-xl">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.28em] text-white/40">
          Progress
        </span>
        <span className="text-xl font-black text-emerald-200">
          {unlockedLevel}/5
        </span>
      </div>

      <div className="absolute bottom-5 left-5 z-30 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl">
        <Play size={20} className="text-emerald-200" fill="currentColor" />
      </div>
    </div>
  );
}
