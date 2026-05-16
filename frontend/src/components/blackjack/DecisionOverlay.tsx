"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { BlackJackDecision, UiHint } from "@/data/blackjackClips";

interface DecisionOverlayProps {
  visible: boolean;
  onDecide: (decision: BlackJackDecision) => void;
  uiHint?: UiHint;
  step: number;
  totalSteps: number;
}

export default function DecisionOverlay({
  visible,
  onDecide,
  uiHint,
  step,
  totalSteps,
}: DecisionOverlayProps) {
  const hitNudged = uiHint === "hit";
  const standNudged = uiHint === "stand";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-between overflow-hidden pointer-events-none"
        >
          <div className="relative z-10 w-full" />

          <div className="relative z-10 flex flex-col items-center gap-2 px-4 select-none">
            <p className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-white/70 text-[10px] uppercase tracking-[0.35em] font-semibold backdrop-blur-sm">
              Raise or stay
            </p>
            <p className="text-white/45 text-[10px] uppercase tracking-[0.28em] font-semibold">
              Decision {step}/{totalSteps}
            </p>
            <motion.p
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-center text-white font-black uppercase leading-none tracking-tight text-[clamp(3.4rem,18vw,6.4rem)]"
              style={{ textShadow: "0 8px 40px rgba(0,0,0,0.85), 0 0 45px rgba(74,222,128,0.35)" }}
            >
              Raise?
            </motion.p>
          </div>

          <div className="relative z-10 w-full px-4 pb-6 flex flex-col gap-3 pointer-events-auto">
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => onDecide("HIT")}
              className={`h-16 w-full rounded-2xl font-black tracking-widest uppercase text-base transition-all duration-150
                ${hitNudged ? "bg-green-400/28 border-green-300/70 text-green-200 shadow-[0_0_30px_rgba(74,222,128,0.45)]" : "bg-green-500/15 border-green-500/25 text-green-300/80"}
                ${standNudged ? "opacity-55 saturate-50" : "opacity-100"}
                hover:bg-green-500/30 hover:border-green-400/60
                active:bg-green-500/40
                backdrop-blur-sm shadow-lg shadow-green-900/30`}
            >
              Hit
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              animate={standNudged ? { boxShadow: ["0 0 0 rgba(250,204,21,0)", "0 0 28px rgba(250,204,21,0.4)", "0 0 0 rgba(250,204,21,0)"] } : { boxShadow: "0 0 0 rgba(0,0,0,0)" }}
              transition={standNudged ? { duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : { duration: 0 }}
              onClick={() => onDecide("STAND")}
              className={`h-16 w-full rounded-2xl font-black tracking-widest uppercase text-base transition-all duration-150
                ${standNudged ? "bg-amber-400/20 border-amber-300/70 text-amber-100" : "bg-white/8 border-white/20 text-white/80"}
                ${hitNudged ? "opacity-60 saturate-50" : "opacity-100"}
                hover:bg-white/12 hover:border-white/30
                active:bg-white/15
                backdrop-blur-sm shadow-lg`}
            >
              Stand
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
