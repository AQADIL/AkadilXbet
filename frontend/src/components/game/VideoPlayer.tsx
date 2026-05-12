"use client";

import { useRef, useEffect, useCallback } from "react";
import type { VideoClip, GamePhase } from "@/types/game";

interface VideoPlayerProps {
  clip: VideoClip;
  phase: GamePhase;
  onDecisionPoint: () => void;
  onResultPoint: () => void;
  onEnded: () => void;
}

export default function VideoPlayer({
  clip,
  phase,
  onDecisionPoint,
  onResultPoint,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasTriggeredDecision = useRef(false);
  const hasTriggeredResult = useRef(false);
  const phaseRef = useRef<GamePhase>(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (
      !hasTriggeredDecision.current &&
      video.currentTime >= clip.decisionTimestamp
    ) {
      hasTriggeredDecision.current = true;
      video.pause();
      onDecisionPoint();
      return;
    }

    if (
      !hasTriggeredResult.current &&
      phaseRef.current === "REVEALING" &&
      video.currentTime >= clip.resultTimestamp
    ) {
      hasTriggeredResult.current = true;
      video.pause();
      onResultPoint();
    }
  }, [clip.decisionTimestamp, clip.resultTimestamp, onDecisionPoint, onResultPoint]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    hasTriggeredDecision.current = false;
    hasTriggeredResult.current = false;
    video.load();

    const onEnded_ = () => {
      if (phaseRef.current === "REVEALING") onResultPoint();
      else onEnded();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", onEnded_);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", onEnded_);
    };
  }, [clip.videoUrl, handleTimeUpdate, onResultPoint, onEnded]);

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
