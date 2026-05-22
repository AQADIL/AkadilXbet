"use client";

import { useEffect, useRef } from "react";

interface AviatorCanvasProps {
  multiplier: number;
  status: string;
}

export default function AviatorCanvas({ multiplier, status }: AviatorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const crashed = status === "crashed";
      const progress = Math.min(1, (multiplier - 1) / 8);
      const planeX = 40 + progress * (w - 120);
      const planeY = h * 0.55 - Math.sin(t * 0.03) * 12;

      ctx.strokeStyle = "rgba(74, 222, 128, 0.15)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, h * 0.35 + i * 28);
        ctx.lineTo(w, h * 0.35 + i * 28 - progress * 40);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(planeX, planeY);
      ctx.rotate(-0.08);
      ctx.fillStyle = crashed ? "#f87171" : "#4ade80";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(48, -6);
      ctx.lineTo(56, 0);
      ctx.lineTo(48, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(74, 222, 128, 0.35)";
      ctx.fillRect(-18, -3, 22, 6);
      ctx.restore();

      if (crashed) {
        ctx.fillStyle = "rgba(248, 113, 113, 0.25)";
        ctx.beginPath();
        ctx.arc(planeX, planeY, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      t++;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [multiplier, status]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden
    />
  );
}
