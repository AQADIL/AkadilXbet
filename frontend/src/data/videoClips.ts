import type { VideoClip } from "@/types/game";

export const VIDEO_CLIPS: VideoClip[] = [
  {
    id: "clip_001",
    videoUrl: "/videos/goal1.mp4",
    thumbnailUrl: "/thumbnails/goal1.jpg",
    decisionTimestamp: 4.5,
    outcome: "GOAL",
    oddsGoal: 1.85,
    oddsNoGoal: 2.1,
    label: "Penalty — Top Right",
  },
  {
    id: "clip_002",
    videoUrl: "/videos/nogoal1.mp4",
    thumbnailUrl: "/thumbnails/nogoal1.jpg",
    decisionTimestamp: 5.2,
    outcome: "NO_GOAL",
    oddsGoal: 1.7,
    oddsNoGoal: 2.3,
    label: "Free Kick — Wall Block",
  },
  {
    id: "clip_003",
    videoUrl: "/videos/goal2.mp4",
    thumbnailUrl: "/thumbnails/goal2.jpg",
    decisionTimestamp: 3.8,
    outcome: "GOAL",
    oddsGoal: 2.0,
    oddsNoGoal: 1.9,
    label: "One-on-One — Keeper",
  },
  {
    id: "clip_004",
    videoUrl: "/videos/nogoal2.mp4",
    thumbnailUrl: "/thumbnails/nogoal2.jpg",
    decisionTimestamp: 6.1,
    outcome: "NO_GOAL",
    oddsGoal: 1.6,
    oddsNoGoal: 2.5,
    label: "Header — Post",
  },
];

export function getRandomClip(excludeId?: string): VideoClip {
  const pool = excludeId
    ? VIDEO_CLIPS.filter((c) => c.id !== excludeId)
    : VIDEO_CLIPS;
  return pool[Math.floor(Math.random() * pool.length)];
}
