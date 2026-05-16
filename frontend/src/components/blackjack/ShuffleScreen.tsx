"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { ShuffleClip } from "@/data/blackjackClips";

interface ShuffleScreenProps {
  clip: ShuffleClip;
  onComplete: () => void;
}

export default function ShuffleScreen({ clip, onComplete }: ShuffleScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setProgress(0);
    video.load();
    video.play().catch(() => {});

    const handleTimeUpdate = () => {
      const pct = Math.min(video.currentTime / clip.durationSeconds, 1);
      setProgress(pct);
    };

    const handleEnded = () => {
      setProgress(1);
      onCompleteRef.current();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [clip.videoUrl, clip.durationSeconds]);

  return (
    <div className="absolute inset-0 z-0 flex flex-col items-center justify-end overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={clip.videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        preload="auto"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

      <div className="relative z-10 w-full px-4 pb-8 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-[10px] uppercase tracking-[0.35em] font-semibold">
            Shuffling deck
          </span>
          <span className="text-white/40 text-[10px] tabular-nums font-semibold">
            {Math.round(progress * 100)}%
          </span>
        </div>

        <div className="w-full h-[3px] rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-green-400"
            style={{ width: `${progress * 100}%` }}
            transition={{ ease: "linear", duration: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
