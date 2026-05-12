"use client";

import { useRef, useEffect, useCallback } from "react";
import type { VideoClip, GamePhase } from "@/types/game";

interface VideoPlayerProps {
  clip: VideoClip;
  phase: GamePhase;
  onDecisionPoint: () => void;
  onEnded: () => void;
}

export default function VideoPlayer({
  clip,
  phase,
  onDecisionPoint,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasTriggeredDecision = useRef(false);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasTriggeredDecision.current) return;

    if (video.currentTime >= clip.decisionTimestamp) {
      hasTriggeredDecision.current = true;
      video.pause();
      onDecisionPoint();
    }
  }, [clip.decisionTimestamp, onDecisionPoint]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    hasTriggeredDecision.current = false;
    video.load();

    const onEnded_ = () => onEnded();
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", onEnded_);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", onEnded_);
    };
  }, [clip.videoUrl, handleTimeUpdate, onEnded]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (phase === "PLAYING" || phase === "REVEALING") {
      video.play().catch(() => {});
    }
  }, [phase]);

  return (
    <video
      ref={videoRef}
      src={clip.videoUrl}
      className="absolute inset-0 w-full h-full object-cover"
      playsInline
      preload="auto"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
