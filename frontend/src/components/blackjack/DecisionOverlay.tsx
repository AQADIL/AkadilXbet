"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { BlackJackDecision } from "@/data/blackjackClips";

interface DecisionOverlayProps {
  visible: boolean;
  onDecide: (decision: BlackJackDecision) => void;
}

export default function DecisionOverlay({ visible, onDecide }: DecisionOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-between overflow-hidden"
        >
          <div className="absolute inset-0 bg-green-950/40 backdrop-blur-xl" />

          <div className="relative z-10 w-full" />

          <div className="relative z-10 flex flex-col items-center gap-3 px-4 select-none pointer-events-none">
            <p className="text-white/50 text-[11px] uppercase tracking-[0.35em] font-semibold">
              Your move
            </p>
            <motion.p
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-white font-black uppercase leading-none tracking-tight text-[clamp(3.5rem,18vw,6rem)]"
              style={{ textShadow: "0 0 60px rgba(74,222,128,0.45)" }}
            >
              Hit or Stand?
            </motion.p>
          </div>

          <div className="relative z-10 w-full px-4 pb-6 flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => onDecide("HIT")}
              className="h-16 w-full rounded-2xl font-black tracking-widest uppercase text-base transition-all duration-150
                bg-green-500/20 border border-green-400/40 text-green-300
                hover:bg-green-500/30 hover:border-green-400/60
                active:bg-green-500/40
                backdrop-blur-md shadow-lg shadow-green-900/30"
            >
              Hit
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => onDecide("STAND")}
              className="h-16 w-full rounded-2xl font-black tracking-widest uppercase text-base transition-all duration-150
                bg-white/8 border border-white/20 text-white/80
                hover:bg-white/12 hover:border-white/30
                active:bg-white/15
                backdrop-blur-md shadow-lg"
            >
              Stand
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
