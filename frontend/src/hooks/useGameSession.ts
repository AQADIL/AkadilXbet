"use client";

import { useCallback } from "react";
import { ref, push } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import type { RoundResult } from "@/types/game";

export function useGameSession() {
  const logResult = useCallback(async (result: RoundResult) => {
    try {
      const roundsRef = ref(rtdb, "rounds");
      await push(roundsRef, {
        clipId: result.bet.clipId,
        choice: result.bet.choice,
        amount: result.bet.amount,
        outcome: result.outcome,
        won: result.won,
        payout: result.payout,
        placedAt: result.bet.placedAt,
      });
    } catch {
    }
  }, []);

  return { logResult };
}
