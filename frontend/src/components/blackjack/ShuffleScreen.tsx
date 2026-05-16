"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Layers, ShieldCheck, Trophy } from "lucide-react";
import type { IntroClip } from "@/data/blackjackClips";

interface ShuffleScreenProps {
  clip: IntroClip;
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

      <div className="absolute inset-0 bg-gradient-to-t from-[#08140C]/85 via-[#08140C]/15 to-[#08140C]/40 pointer-events-none" />

      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: progress > 0.4 ? 1 : 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <div className="absolute inset-x-0 top-[18%] flex flex-col items-center gap-3">
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: progress > 0.55 ? 0 : 12, opacity: progress > 0.55 ? 1 : 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center"
          >
            <Layers size={28} className="text-green-300" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: progress > 0.62 ? 1 : 0, y: progress > 0.62 ? 0 : 12 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-[clamp(2rem,10vw,3.2rem)] font-black uppercase tracking-tight text-white"
            style={{ textShadow: "0 0 42px rgba(74,222,128,0.35)" }}
          >
            BlackJack
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: progress > 0.72 ? 1 : 0, y: progress > 0.72 ? 0 : 10 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-2"
          >
            <span className="h-8 px-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl text-white/80 text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <ShieldCheck size={14} />
              Secure Table
            </span>
            <span className="h-8 px-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl text-white/80 text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <Trophy size={14} />
              Ranked Levels
            </span>
          </motion.div>
        </div>
      </motion.div>

      <div className="relative z-10 w-full px-4 pb-8 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-[10px] uppercase tracking-[0.35em] font-semibold">
            Entering table
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
