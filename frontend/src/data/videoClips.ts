import type { VideoClip } from "@/types/game";

export const VIDEO_CLIPS: VideoClip[] = [
  {
    id: "clip_001",
    videoUrl: "/videos/goal1.mp4",
    decisionTimestamp: 2.5,
    resultTimestamp: 6.0,
    outcome: "GOAL",
    oddsGoal: 1.85,
    oddsNoGoal: 2.1,
  },
  {
    id: "clip_002",
    videoUrl: "/videos/nogoal1.mp4",
    decisionTimestamp: 5.2,
    resultTimestamp: 9.5,
    outcome: "NO_GOAL",
    oddsGoal: 1.7,
    oddsNoGoal: 2.3,
  },
  {
    id: "clip_003",
    videoUrl: "/videos/goal2.mp4",
    decisionTimestamp: 3.8,
    resultTimestamp: 10.0,
    outcome: "GOAL",
    oddsGoal: 2.0,
    oddsNoGoal: 1.9,
  },
  {
    id: "clip_004",
    videoUrl: "/videos/nogoal2.mp4",
    decisionTimestamp: 1.8,
    resultTimestamp: 3.0,
    outcome: "NO_GOAL",
    oddsGoal: 1.6,
    oddsNoGoal: 2.5,
  },
];

export function getRandomClip(excludeId?: string): VideoClip {
  const pool = excludeId
    ? VIDEO_CLIPS.filter((c) => c.id !== excludeId)
    : VIDEO_CLIPS;
  return pool[Math.floor(Math.random() * pool.length)];
}
