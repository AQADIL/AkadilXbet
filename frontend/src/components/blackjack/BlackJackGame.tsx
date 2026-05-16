"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ShuffleScreen from "@/components/blackjack/ShuffleScreen";
import DecisionOverlay from "@/components/blackjack/DecisionOverlay";
import BlackJackResultOverlay from "@/components/blackjack/BlackJackResultOverlay";
import {
  getRandomShuffleClip,
  getRandomBlackJackClip,
  type BlackJackClip,
  type BlackJackDecision,
  type BlackJackOutcome,
  type ShuffleClip,
} from "@/data/blackjackClips";

type GamePhase = "SHUFFLE" | "PLAYING" | "DECISION" | "RESULT";

export default function BlackJackGame() {
  const [phase, setPhase] = useState<GamePhase>("SHUFFLE");
  const [shuffleClip] = useState<ShuffleClip>(() => getRandomShuffleClip());
  const [clip, setClip] = useState<BlackJackClip>(() => getRandomBlackJackClip());
  const [decision, setDecision] = useState<BlackJackDecision | null>(null);
  const [outcome, setOutcome] = useState<BlackJackOutcome | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hasTriggeredDecision = useRef(false);
  const clipRef = useRef(clip);
  const phaseRef = useRef<GamePhase>(phase);

  useEffect(() => { clipRef.current = clip; }, [clip]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const handleShuffleComplete = useCallback(() => {
    setPhase("PLAYING");
  }, []);

  useEffect(() => {
    if (phase !== "PLAYING") return;
    const video = videoRef.current;
    if (!video) return;

    hasTriggeredDecision.current = false;
    video.load();
    video.play().catch(() => {});

    const handleTimeUpdate = () => {
      const v = videoRef.current;
      if (!v || hasTriggeredDecision.current) return;
      if (v.currentTime >= clipRef.current.decisionTimestamp) {
        hasTriggeredDecision.current = true;
        v.pause();
        setPhase("DECISION");
      }
    };

    const handleEnded = () => {
      if (phaseRef.current !== "RESULT") {
        setPhase("RESULT");
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [phase, clip.videoUrl]);

  const handleDecide = useCallback(
    (picked: BlackJackDecision) => {
      const result =
        picked === "HIT" ? clipRef.current.hitOutcome : clipRef.current.standOutcome;
      setDecision(picked);
      setOutcome(result);
      setPhase("RESULT");
      videoRef.current?.play().catch(() => {});
    },
    []
  );

  const handleNext = useCallback(() => {
    setDecision(null);
    setOutcome(null);
    const next = getRandomBlackJackClip(clip.id);
    setClip(next);
    setPhase("SHUFFLE");
  }, [clip.id]);

  return (
    <div className="relative w-full h-[calc(100svh-4rem)] bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "SHUFFLE" && (
          <motion.div
            key="shuffle"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ShuffleScreen clip={shuffleClip} onComplete={handleShuffleComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {phase !== "SHUFFLE" && (
        <>
          <video
            ref={videoRef}
            src={clip.videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            preload="auto"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
          />

          <div
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-5 pb-6 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }}
          >
            <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-semibold">
              BlackJack
            </span>
          </div>

          <DecisionOverlay
            visible={phase === "DECISION"}
            onDecide={handleDecide}
          />

          {phase === "RESULT" && (
            <BlackJackResultOverlay
              outcome={outcome}
              decision={decision}
              onNext={handleNext}
            />
          )}
        </>
      )}
    </div>
  );
}
