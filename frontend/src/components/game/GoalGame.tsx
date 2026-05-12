"use client";

import { useState, useCallback } from "react";
import VideoPlayer from "@/components/game/VideoPlayer";
import BettingOverlay from "@/components/game/BettingOverlay";
import ResultOverlay from "@/components/game/ResultOverlay";
import { useGameSession } from "@/hooks/useGameSession";
import { getRandomClip } from "@/data/videoClips";
import type { BetChoice, GamePhase, RoundResult, VideoClip } from "@/types/game";

export default function GoalGame() {
  const [clip, setClip] = useState<VideoClip>(() => getRandomClip());
  const [phase, setPhase] = useState<GamePhase>("PLAYING");
  const [result, setResult] = useState<RoundResult | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const { logResult } = useGameSession();

  const handleDecisionPoint = useCallback(() => {
    setPhase("DECISION");
  }, []);

  const handleBetPlaced = useCallback(
    (choice: BetChoice) => {
      const won = choice === clip.outcome;
      const oddsForChoice = choice === "GOAL" ? clip.oddsGoal : clip.oddsNoGoal;
      const roundResult: RoundResult = {
        bet: { clipId: clip.id, choice, amount: 0, placedAt: Date.now() },
        outcome: clip.outcome,
        won,
        payout: won ? Math.floor(100 * oddsForChoice) : 0,
      };
      setResult(roundResult);
      setTimedOut(false);
      setPhase("REVEALING");
    },
    [clip]
  );

  const handleTimeout = useCallback(() => {
    setResult(null);
    setTimedOut(true);
    setPhase("REVEALING");
  }, []);

  const handleResultPoint = useCallback(async () => {
    setPhase("RESULT");
    if (result) await logResult(result);
  }, [result, logResult]);

  const handleVideoEnded = useCallback(() => {
    if (phase === "REVEALING") handleResultPoint();
  }, [phase, handleResultPoint]);

  const handleNextGame = useCallback(() => {
    setResult(null);
    setTimedOut(false);
    const next = getRandomClip(clip.id);
    setClip(next);
    setPhase("PLAYING");
  }, [clip.id]);

  return (
    <div className="relative w-full h-[calc(100svh-4rem)] bg-black overflow-hidden">
      <VideoPlayer
        clip={clip}
        phase={phase}
        onDecisionPoint={handleDecisionPoint}
        onResultPoint={handleResultPoint}
        onEnded={handleVideoEnded}
      />

      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-safe-top pt-4 pb-6 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }}
      >
        <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-semibold">
          24/7 · Goal or No Goal
        </span>
        <div className="flex gap-3">
          <span className="text-white/40 text-[10px] uppercase tracking-widest">
            Goal <span className="text-green-400/70 font-bold">x{clip.oddsGoal.toFixed(2)}</span>
          </span>
          <span className="text-white/40 text-[10px] uppercase tracking-widest">
            No Goal <span className="text-white/60 font-bold">x{clip.oddsNoGoal.toFixed(2)}</span>
          </span>
        </div>
      </div>

      {phase === "DECISION" && (
        <BettingOverlay
          visible
          onBetPlaced={handleBetPlaced}
          onTimeout={handleTimeout}
        />
      )}

      {phase === "RESULT" && (
        <ResultOverlay
          result={result}
          timedOut={timedOut}
          onNext={handleNextGame}
        />
      )}
    </div>
  );
}
