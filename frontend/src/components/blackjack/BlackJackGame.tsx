"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ShuffleScreen from "@/components/blackjack/ShuffleScreen";
import DecisionOverlay from "@/components/blackjack/DecisionOverlay";
import BlackJackResultOverlay from "@/components/blackjack/BlackJackResultOverlay";
import BettingOverlay from "@/components/blackjack/BettingOverlay";
import LevelMap from "@/components/blackjack/LevelMap";
import {
  getRandomIntroClip,
  getBlackJackClipByLevel,
  type BlackJackClip,
  type BlackJackDecision,
  type BlackJackOutcome,
  type IntroClip,
} from "@/data/blackjackClips";

type GamePhase = "INTRO" | "LEVELS" | "BETTING" | "PLAYING" | "DECISION" | "RESULT";

export default function BlackJackGame() {
  const [phase, setPhase] = useState<GamePhase>("INTRO");
  const [introClip] = useState<IntroClip>(() => getRandomIntroClip());
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [clip, setClip] = useState<BlackJackClip>(() => getBlackJackClipByLevel(1));
  const [decisionIndex, setDecisionIndex] = useState(0);
  const [decision, setDecision] = useState<BlackJackDecision | null>(null);
  const [outcome, setOutcome] = useState<BlackJackOutcome | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleIntroComplete = useCallback(() => {
    setPhase("LEVELS");
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || phase !== "PLAYING") return;

    const timestamps = clip.decisionTimestamps;
    if (decisionIndex >= timestamps.length) return;

    if (v.currentTime >= timestamps[decisionIndex]) {
      v.pause();
      setPhase("DECISION");
    }
  }, [phase, clip.decisionTimestamps, decisionIndex]);

  const handleEnded = useCallback(() => {
    if (phase !== "RESULT") {
      setPhase("RESULT");
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "PLAYING") return;
    videoRef.current?.play().catch(() => {});
  }, [phase]);

  const handleStartLevel = useCallback((level = selectedLevel) => {
    const levelClip = getBlackJackClipByLevel(level);
    setSelectedLevel(level);
    setClip(levelClip);
    setDecision(null);
    setOutcome(levelClip.outcome);
    setDecisionIndex(0);
    setPhase("BETTING");
  }, [selectedLevel]);

  const handlePlayAfterBet = useCallback((betAmount: number) => {
    // В будущем тут можно сохранить betAmount в стейт или отправить на бекенд
    setPhase("PLAYING");
  }, []);

  const handleDecide = useCallback(
    (picked: BlackJackDecision) => {
      setDecision(picked);

      setDecisionIndex((prev) => prev + 1);

      setPhase("PLAYING");
      videoRef.current?.play().catch(() => {});
    },
    []
  );

  const handleNext = useCallback(() => {
    setPreviousLevel(selectedLevel);
    // Открываем следующий уровень в любом случае
    if (selectedLevel === unlockedLevel && unlockedLevel < 5) {
      setUnlockedLevel((prev) => Math.min(5, prev + 1));
      setSelectedLevel((prev) => Math.min(5, prev + 1));
    }
    setPhase("LEVELS");
  }, [selectedLevel, unlockedLevel]);

  return (
    <div className="fixed inset-0 z-40 bg-black overflow-hidden">
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
            className="absolute inset-0 z-20 bg-[#08140C] pb-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative h-full w-full p-3">
              <LevelMap
                unlockedLevel={unlockedLevel}
                selectedLevel={selectedLevel}
                previousLevel={previousLevel}
                onSelect={(lvl: number) => {
                  setPreviousLevel(selectedLevel);
                  setSelectedLevel(lvl);
                }}
                onStart={handleStartLevel}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "BETTING" && (
          <BettingOverlay onPlay={handlePlayAfterBet} level={selectedLevel} />
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
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />

          <DecisionOverlay
            visible={phase === "DECISION"}
            onDecide={handleDecide}
            uiHint={clip.uiHint}
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
