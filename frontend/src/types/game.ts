export type GameOutcome = "GOAL" | "NO_GOAL";
export type BetChoice = "GOAL" | "NO_GOAL";
export type GamePhase =
  | "LOADING"
  | "PLAYING"
  | "DECISION"
  | "REVEALING"
  | "RESULT";

export interface VideoClip {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  decisionTimestamp: number;
  outcome: GameOutcome;
  oddsGoal: number;
  oddsNoGoal: number;
  label: string;
}

export interface PlacedBet {
  clipId: string;
  choice: BetChoice;
  amount: number;
  placedAt: number;
}

export interface RoundResult {
  bet: PlacedBet;
  outcome: GameOutcome;
  won: boolean;
  payout: number;
}

export interface GameSession {
  userId: string;
  rounds: RoundResult[];
  totalWagered: number;
  totalPayout: number;
  startedAt: number;
}
