"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { BlackJackDecision, UiHint } from "@/data/blackjackClips";

interface DecisionOverlayProps {
  visible: boolean;
  onDecide: (decision: BlackJackDecision) => void;
  uiHint?: "hit" | "stand";
}

export default function DecisionOverlay({
  visible,
  onDecide,
  uiHint,
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

          <div className="relative z-10 w-full px-8 pb-28 flex gap-4 pointer-events-auto">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => onDecide("HIT")}
              className={`h-14 flex-1 rounded-2xl font-black tracking-widest uppercase text-sm transition-all duration-150
                ${hitNudged ? "bg-green-400 border border-green-300 text-green-950 shadow-[0_0_30px_rgba(74,222,128,0.45)]" : "bg-green-500/15 border border-green-500/25 text-green-300"}
                ${standNudged ? "opacity-50 saturate-50" : "opacity-100"}
                hover:bg-green-500/30 hover:border-green-400/60
                active:bg-green-500/40
                backdrop-blur-md shadow-lg shadow-black/50`}
            >
              Hit
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              animate={standNudged ? { boxShadow: ["0 0 0 rgba(250,204,21,0)", "0 0 28px rgba(250,204,21,0.4)", "0 0 0 rgba(250,204,21,0)"] } : { boxShadow: "0 0 0 rgba(0,0,0,0)" }}
              transition={standNudged ? { duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : { duration: 0 }}
              onClick={() => onDecide("STAND")}
              className={`h-14 flex-1 rounded-2xl font-black tracking-widest uppercase text-sm transition-all duration-150
                ${standNudged ? "bg-amber-400 border border-amber-300 text-amber-950 shadow-[0_0_30px_rgba(250,204,21,0.45)]" : "bg-white/10 border border-white/20 text-white"}
                ${hitNudged ? "opacity-50 saturate-50" : "opacity-100"}
                hover:bg-white/15 hover:border-white/30
                active:bg-white/20
                backdrop-blur-md shadow-lg shadow-black/50`}
            >
              Stand
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
