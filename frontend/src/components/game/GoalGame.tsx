"use client";

import { useState, useCallback } from "react";
import VideoPlayer from "@/components/game/VideoPlayer";
import BettingOverlay from "@/components/game/BettingOverlay";
import ResultOverlay from "@/components/game/ResultOverlay";
import { useGameSession } from "@/hooks/useGameSession";
import { getRandomClip } from "@/data/videoClips";
import type { BetChoice, GamePhase, PlacedBet, RoundResult, VideoClip } from "@/types/game";

export default function GoalGame() {
  const [clip, setClip] = useState<VideoClip>(() => getRandomClip());
  const [phase, setPhase] = useState<GamePhase>("PLAYING");
  const [activeBet, setActiveBet] = useState<PlacedBet | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);

  const { logResult } = useGameSession();

  const handleDecisionPoint = useCallback(() => {
    setPhase("DECISION");
  }, []);

  const handleBetPlaced = useCallback(
    (choice: BetChoice, amount: number) => {
      const bet: PlacedBet = {
        clipId: clip.id,
        choice,
        amount,
        placedAt: Date.now(),
      };
      setActiveBet(bet);
      setPhase("REVEALING");
    },
    [clip.id]
  );

  const handleTimeout = useCallback(() => {
    setActiveBet(null);
    setPhase("REVEALING");
  }, []);

  const handleVideoEnded = useCallback(async () => {
    if (!activeBet) {
      setPhase("RESULT");
      setResult(null);
      return;
    }

    const won = activeBet.choice === clip.outcome;
    const oddsForChoice =
      activeBet.choice === "GOAL" ? clip.oddsGoal : clip.oddsNoGoal;
    const payout = won ? Math.floor(activeBet.amount * oddsForChoice) : 0;

    const roundResult: RoundResult = {
      bet: activeBet,
      outcome: clip.outcome,
      won,
      payout,
    };

    setResult(roundResult);
    setPhase("RESULT");
    await logResult(roundResult);
  }, [activeBet, clip, logResult]);

  const handleNextGame = useCallback(() => {
    setActiveBet(null);
    setResult(null);
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
        onEnded={handleVideoEnded}
      />

      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4 pb-2"
        style={{ background: "linear-gradient(to bottom, rgba(8,20,12,0.85) 0%, transparent 100%)" }}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-text-muted text-[10px] uppercase tracking-widest font-semibold">
            24/7 Bets — Goal or No Goal
          </span>
          <span className="text-text-secondary text-sm font-bold">
            {clip.label}
          </span>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-text-muted text-[9px] uppercase tracking-widest">Goal</span>
            <span className="text-brand-glow text-sm font-black tabular-nums">x{clip.oddsGoal.toFixed(2)}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-text-muted text-[9px] uppercase tracking-widest">No Goal</span>
            <span className="text-text-secondary text-sm font-black tabular-nums">x{clip.oddsNoGoal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {phase === "DECISION" && (
        <BettingOverlay
          clip={clip}
          visible
          onBetPlaced={handleBetPlaced}
          onTimeout={handleTimeout}
        />
      )}

      {phase === "RESULT" && (
        <ResultOverlay result={result} onNext={handleNextGame} />
      )}
    </div>
  );
}
