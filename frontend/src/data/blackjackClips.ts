export type BlackJackOutcome = "WIN" | "LOSE" | "PUSH";
export type BlackJackDecision = "HIT" | "STAND";
export type UiHint = "hit" | "stand";

export interface BlackJackClip {
  id: string;
  level: number;
  title: string;
  videoUrl: string;
  decisionTimestamps: number[];
  uiHint?: UiHint;
  scriptedChoice?: BlackJackDecision;
  outcome: BlackJackOutcome;
}

export interface IntroClip {
  id: string;
  videoUrl: string;
  durationSeconds: number;
}

export const INTRO_CLIPS: IntroClip[] = [
  { id: "intro_01", videoUrl: "/videos/blackjack/loading1.mov", durationSeconds: 6 },
  { id: "intro_02", videoUrl: "/videos/blackjack/loading2.mp4", durationSeconds: 8.5 },
];

export const BLACKJACK_CLIPS: BlackJackClip[] = [
  {
    id: "bj_001",
    level: 1,
    title: "Instant 21",
    videoUrl: "/videos/blackjack/outcome-1.mp4",  
    decisionTimestamps: [],
    outcome: "WIN",
  },
  {
    id: "bj_002",
    level: 2,
    title: "20 vs 18",
    videoUrl: "/videos/blackjack/outcome-2.mp4",
    decisionTimestamps: [13.6],
    uiHint: "hit",
    scriptedChoice: "HIT",
    outcome: "WIN",
  },
  {
    id: "bj_003",
    level: 3,
    title: "4 Aces Miracle",
    videoUrl: "/videos/blackjack/outcome-3.mp4",
    decisionTimestamps: [15, 17.6, 20, 22.5],
    uiHint: "hit",
    scriptedChoice: "HIT",
    outcome: "WIN",
  },
  {
    id: "bj_004",
    level: 4,
    title: "Stand and Lose",
    videoUrl: "/videos/blackjack/outcome-4.mp4",
    decisionTimestamps: [14],
    uiHint: "stand",
    scriptedChoice: "STAND",
    outcome: "LOSE",
  },
  {
    id: "bj_005",
    level: 5,
    title: "Bust All-In",
    videoUrl: "/videos/blackjack/outcome-5.mp4",
    decisionTimestamps: [12],
    uiHint: "hit",
    scriptedChoice: "HIT",
    outcome: "LOSE",
  },
];

export function getRandomIntroClip(): IntroClip {
  return INTRO_CLIPS[Math.floor(Math.random() * INTRO_CLIPS.length)];
}

export function getRandomBlackJackClip(excludeId?: string): BlackJackClip {
  const pool = excludeId
    ? BLACKJACK_CLIPS.filter((c) => c.id !== excludeId)
    : BLACKJACK_CLIPS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getBlackJackClipByLevel(level: number): BlackJackClip {
  const found = BLACKJACK_CLIPS.find((clip) => clip.level === level);
  return found ?? BLACKJACK_CLIPS[0];
}
