"use client";

import { useRef, useEffect } from "react";
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
  const clipRef = useRef(clip);
  const onDecisionPointRef = useRef(onDecisionPoint);
  const onResultPointRef = useRef(onResultPoint);
  const onEndedRef = useRef(onEnded);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { clipRef.current = clip; }, [clip]);
  useEffect(() => { onDecisionPointRef.current = onDecisionPoint; }, [onDecisionPoint]);
  useEffect(() => { onResultPointRef.current = onResultPoint; }, [onResultPoint]);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    hasTriggeredDecision.current = false;
    hasTriggeredResult.current = false;
    video.load();

    const handleTimeUpdate = () => {
      const v = videoRef.current;
      if (!v) return;
      const c = clipRef.current;

      if (!hasTriggeredDecision.current && v.currentTime >= c.decisionTimestamp) {
        hasTriggeredDecision.current = true;
        v.pause();
        onDecisionPointRef.current();
        return;
      }

      if (
        !hasTriggeredResult.current &&
        phaseRef.current === "REVEALING" &&
        v.currentTime >= c.resultTimestamp
      ) {
        hasTriggeredResult.current = true;
        onResultPointRef.current();
      }
    };

    const handleEnded = () => {
      if (phaseRef.current === "REVEALING") onResultPointRef.current();
      else onEndedRef.current();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [clip.videoUrl]);

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
