"use client";

import { useCallback } from "react";
import type { RoundResult } from "@/types/game";

export function useGameSession() {
  const logResult = useCallback(async (_result: RoundResult) => {
    return;
  }, []);

  return { logResult };
}
