"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ShuffleScreen from "@/components/blackjack/ShuffleScreen";
import DecisionOverlay from "@/components/blackjack/DecisionOverlay";
import BlackJackResultOverlay from "@/components/blackjack/BlackJackResultOverlay";
import LevelMap from "@/components/blackjack/LevelMap";
import {
  getRandomIntroClip,
  getBlackJackClipByLevel,
  type BlackJackClip,
  type BlackJackDecision,
  type BlackJackOutcome,
  type IntroClip,
} from "@/data/blackjackClips";

type GamePhase = "INTRO" | "LEVELS" | "PLAYING" | "DECISION" | "RESULT";

export default function BlackJackGame() {
  const [phase, setPhase] = useState<GamePhase>("INTRO");
  const [introClip] = useState<IntroClip>(() => getRandomIntroClip());
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [clip, setClip] = useState<BlackJackClip>(() => getBlackJackClipByLevel(1));
  const [decisionIndex, setDecisionIndex] = useState(0);
  const [decision, setDecision] = useState<BlackJackDecision | null>(null);
  const [outcome, setOutcome] = useState<BlackJackOutcome | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const clipRef = useRef(clip);
  const phaseRef = useRef<GamePhase>(phase);
  const decisionIndexRef = useRef(decisionIndex);

  useEffect(() => { clipRef.current = clip; }, [clip]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { decisionIndexRef.current = decisionIndex; }, [decisionIndex]);

  const handleIntroComplete = useCallback(() => {
    setPhase("LEVELS");
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();

    const handleTimeUpdate = () => {
      const v = videoRef.current;
      if (!v || phaseRef.current !== "PLAYING") return;

      const timestamps = clipRef.current.decisionTimestamps;
      const idx = decisionIndexRef.current;
      if (idx >= timestamps.length) return;

      if (v.currentTime >= timestamps[idx]) {
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
  }, [clip.videoUrl]);

  useEffect(() => {
    if (phase !== "PLAYING") return;
    videoRef.current?.play().catch(() => {});
  }, [phase]);

  const handleStartLevel = useCallback(() => {
    const levelClip = getBlackJackClipByLevel(selectedLevel);
    setClip(levelClip);
    setDecision(null);
    setOutcome(levelClip.outcome);
    setDecisionIndex(0);
    setPhase("PLAYING");
  }, [selectedLevel]);

  const handleDecide = useCallback(
    (picked: BlackJackDecision) => {
      setDecision(picked);

      setDecisionIndex((prev) => {
        const next = prev + 1;
        decisionIndexRef.current = next;
        return next;
      });

      setPhase("PLAYING");
      videoRef.current?.play().catch(() => {});
    },
    []
  );

  const handleNext = useCallback(() => {
    if (outcome === "WIN" && selectedLevel === unlockedLevel && unlockedLevel < 5) {
      setUnlockedLevel((prev) => Math.min(5, prev + 1));
      setSelectedLevel((prev) => Math.min(5, prev + 1));
    }
    setPhase("LEVELS");
  }, [outcome, selectedLevel, unlockedLevel]);

  return (
    <div className="relative w-full h-[calc(100svh-4rem)] bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "INTRO" && (
          <motion.div
            key="intro"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ShuffleScreen clip={introClip} onComplete={handleIntroComplete} />
          </motion.div>
        )}

        {phase === "LEVELS" && (
          <motion.div
            key="levels"
            className="absolute inset-0 z-20 flex flex-col bg-[#08140C]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative flex-1 min-h-0 p-3">
              <LevelMap
                unlockedLevel={unlockedLevel}
                selectedLevel={selectedLevel}
                onSelect={setSelectedLevel}
              />
            </div>

            <div className="relative z-30 px-4 pb-4 flex flex-col gap-3">
              <div className="rounded-2xl border border-white/15 bg-[#112A18]/70 backdrop-blur-xl px-4 py-3 shadow-xl">
                <p className="text-white/45 text-[10px] uppercase tracking-[0.3em] font-semibold mb-1">
                  Current Story
                </p>
                <p className="text-white text-lg font-black uppercase tracking-wide">
                  {getBlackJackClipByLevel(selectedLevel).title}
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartLevel}
                className="h-16 w-full rounded-2xl bg-gradient-to-b from-green-400 to-green-600 text-[#08140C] font-black uppercase tracking-widest text-base shadow-[0_16px_40px_rgba(34,197,94,0.3)] active:scale-[0.98] transition-transform"
              >
                Play Level {selectedLevel}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(phase === "PLAYING" || phase === "DECISION" || phase === "RESULT") && (
        <>
          <video
            ref={videoRef}
            src={clip.videoUrl}
            className="absolute inset-0 w-full h-full object-contain bg-black"
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
              BlackJack Level {clip.level}
            </span>
            <span className="text-white/55 text-[11px] uppercase tracking-wider font-semibold">
              {clip.title}
            </span>
          </div>

          <DecisionOverlay
            visible={phase === "DECISION"}
            onDecide={handleDecide}
            uiHint={clip.uiHint}
            step={Math.min(decisionIndex + 1, Math.max(1, clip.decisionTimestamps.length))}
            totalSteps={Math.max(1, clip.decisionTimestamps.length)}
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
