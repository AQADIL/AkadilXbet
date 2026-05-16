export type BlackJackOutcome = "WIN" | "LOSE" | "PUSH";
export type BlackJackDecision = "HIT" | "STAND";

export interface BlackJackClip {
  id: string;
  videoUrl: string;
  decisionTimestamp: number;
  hitOutcome: BlackJackOutcome;
  standOutcome: BlackJackOutcome;
}

export interface ShuffleClip {
  videoUrl: string;
  durationSeconds: number;
}

export const SHUFFLE_CLIPS: ShuffleClip[] = [
  { videoUrl: "/videos/blackjack/shuffle-10s.mp4", durationSeconds: 10 },
  { videoUrl: "/videos/blackjack/shuffle-7s.mp4", durationSeconds: 7 },
];

export const BLACKJACK_CLIPS: BlackJackClip[] = [
  {
    id: "bj_001",
    videoUrl: "/videos/blackjack/outcome-1.mp4",
    decisionTimestamp: 4.5,
    hitOutcome: "WIN",
    standOutcome: "LOSE",
  },
  {
    id: "bj_002",
    videoUrl: "/videos/blackjack/outcome-2.mp4",
    decisionTimestamp: 4.5,
    hitOutcome: "LOSE",
    standOutcome: "WIN",
  },
  {
    id: "bj_003",
    videoUrl: "/videos/blackjack/outcome-3.mp4",
    decisionTimestamp: 4.5,
    hitOutcome: "WIN",
    standOutcome: "WIN",
  },
];

export function getRandomShuffleClip(): ShuffleClip {
  return SHUFFLE_CLIPS[Math.floor(Math.random() * SHUFFLE_CLIPS.length)];
}

export function getRandomBlackJackClip(excludeId?: string): BlackJackClip {
  const pool = excludeId
    ? BLACKJACK_CLIPS.filter((c) => c.id !== excludeId)
    : BLACKJACK_CLIPS;
  return pool[Math.floor(Math.random() * pool.length)];
}
