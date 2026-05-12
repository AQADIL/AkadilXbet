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
    <div className="relative w-full">
      <div className="relative">
        <VideoPlayer
          clip={clip}
          phase={phase}
          onDecisionPoint={handleDecisionPoint}
          onEnded={handleVideoEnded}
        />

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

      <div className="mt-3 px-1 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-text-muted text-[10px] uppercase tracking-widest">
            Current Clip
          </span>
          <span className="text-text-secondary text-sm font-semibold">
            {clip.label}
          </span>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-text-muted text-[10px] uppercase tracking-widest">
              Goal Odds
            </span>
            <span className="text-brand-glow text-sm font-black tabular-nums">
              x{clip.oddsGoal.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-text-muted text-[10px] uppercase tracking-widest">
              No Goal
            </span>
            <span className="text-text-secondary text-sm font-black tabular-nums">
              x{clip.oddsNoGoal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
