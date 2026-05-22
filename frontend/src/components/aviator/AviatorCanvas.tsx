"use client";

import { useEffect, useRef } from "react";

interface AviatorCanvasProps {
  multiplier: number;
  status: string;
}

export default function AviatorCanvas({ multiplier, status }: AviatorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  // Synchronize dynamic parameters in refs so we do not tear down the canvas animation loop
  const multiplierRef = useRef(multiplier);
  const statusRef = useRef(status);

  useEffect(() => {
    multiplierRef.current = multiplier;
    statusRef.current = status;
  }, [multiplier, status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Persistent state across frames
    let smoothed = multiplierRef.current;
    let t = 0;
    let particles: Array<{ x: number; y: number; size: number; alpha: number; speedY: number }> = [];
    let explosionParticles: Array<{ x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number }> = [];
    let shockwaveRadius = 0;
    let wasCrashed = false;

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const targetMult = multiplierRef.current;
      const currentStatus = statusRef.current;
      const crashed = currentStatus === "crashed";

      // Reset state if starting a new round
      if (currentStatus === "waiting") {
        smoothed = 1.0;
        particles = [];
        explosionParticles = [];
        shockwaveRadius = 0;
        wasCrashed = false;
      } else {
        // Direct coupling since targetMult is predicted smoothly at 60 FPS
        smoothed = targetMult;
      }

      // Calculate path progress (scaled up to 10.0x for max progress)
      const progress = Math.min(1, (smoothed - 1) / 9);

      // Coordinates mapping
      const startX = 40;
      const endX = w - 80;
      const planeX = startX + progress * (endX - startX);

      // Bezier curve control points
      const startY = h * 0.85;
      const controlY = h * 0.78;
      const endY = h * 0.2;

      // Calculate base Y position on quadratic Bezier curve
      const basePlaneY =
        (1 - progress) * (1 - progress) * startY +
        2 * (1 - progress) * progress * controlY +
        progress * progress * endY;

      // Plane bobs smoothly unless crashed
      const planeY = crashed ? basePlaneY : basePlaneY - Math.sin(t * 0.05) * 8;

      // 1. Draw glowing grid lines with backwards parallax scroll
      ctx.strokeStyle = "rgba(74, 222, 128, 0.04)";
      ctx.lineWidth = 1;
      const gridSpacing = 44;
      const scrollOffset = crashed ? 0 : (t * 0.75) % gridSpacing;
      
      // Vertical lines
      for (let x = -scrollOffset; x < w; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      // Horizontal lines
      for (let y = 0; y < h; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 2. Draw sleek neon trajectory curve
      if (smoothed > 1.0) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);

        const steps = 60;
        for (let i = 1; i <= steps; i++) {
          const p = (i / steps) * progress;
          const currX = startX + p * (endX - startX);
          const currY =
            (1 - p) * (1 - p) * startY +
            2 * (1 - p) * p * controlY +
            p * p * endY;
          
          const bobbedY = (crashed && p >= progress - 0.02)
            ? currY
            : currY - Math.sin((t - (steps - i)) * 0.05) * 8;

          if (i === steps) {
            ctx.lineTo(planeX, planeY);
          } else {
            ctx.lineTo(currX, bobbedY);
          }
        }

        ctx.strokeStyle = crashed ? "rgba(248, 113, 113, 0.75)" : "rgba(74, 222, 128, 0.75)";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = crashed ? "rgba(248, 113, 113, 0.5)" : "rgba(74, 222, 128, 0.5)";
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset glow

        // 3. Draw gradient fill under the curve
        ctx.lineTo(planeX, h);
        ctx.lineTo(startX, h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, h * 0.2, 0, h);
        if (crashed) {
          grad.addColorStop(0, "rgba(248, 113, 113, 0.2)");
          grad.addColorStop(1, "rgba(248, 113, 113, 0.0)");
        } else {
          grad.addColorStop(0, "rgba(74, 222, 128, 0.2)");
          grad.addColorStop(1, "rgba(74, 222, 128, 0.0)");
        }
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // 4. Particle exhaust system
      if (!crashed && currentStatus === "flying" && t % 2 === 0) {
        particles.push({
          x: planeX - 12,
          y: planeY + 2,
          size: Math.random() * 3 + 1.5,
          alpha: 1.0,
          speedY: (Math.random() - 0.5) * 0.6,
        });
      }

      // Update & render exhaust particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x -= 1.6;
        p.y += p.speedY;
        p.alpha -= 0.03;
        p.size *= 0.96;

        if (p.alpha <= 0 || p.x < 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(74, 222, 128, ${p.alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Crash explosion & shockwaves
      if (crashed) {
        if (!wasCrashed) {
          wasCrashed = true;
          // Spawn fiery sparks
          const sparks = 36;
          for (let i = 0; i < sparks; i++) {
            const angle = Math.random() * Math.PI * 2;
            const sp = Math.random() * 4.5 + 1.5;
            explosionParticles.push({
              x: planeX,
              y: planeY,
              vx: Math.cos(angle) * sp,
              vy: Math.sin(angle) * sp - 1.2,
              size: Math.random() * 3.5 + 2.5,
              color: Math.random() > 0.5 ? "#f59e0b" : "#ef4444",
              alpha: 1.0,
            });
          }
        }

        // Render explosion sparks
        for (let i = explosionParticles.length - 1; i >= 0; i--) {
          const ep = explosionParticles[i];
          ep.x += ep.vx;
          ep.y += ep.vy;
          ep.vy += 0.07; // gravity
          ep.alpha -= 0.022;
          ep.size *= 0.95;

          if (ep.alpha <= 0) {
            explosionParticles.splice(i, 1);
            continue;
          }

          ctx.fillStyle = ep.color;
          ctx.globalAlpha = ep.alpha;
          ctx.beginPath();
          ctx.arc(ep.x, ep.y, ep.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Neon shockwave ring
        shockwaveRadius += 3.2;
        const ringAlpha = Math.max(0, 1 - shockwaveRadius / 90);
        if (ringAlpha > 0) {
          ctx.strokeStyle = `rgba(239, 68, 68, ${ringAlpha * 0.75})`;
          ctx.lineWidth = 2;
          ctx.shadowColor = "rgba(239, 68, 68, 0.4)";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(planeX, planeY, shockwaveRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // 6. Draw modern custom vector plane
      if (!crashed) {
        ctx.save();
        ctx.translate(planeX, planeY);

        // Smoothly adjust rotation pitch based on time
        const pitch = -0.06 + Math.sin(t * 0.05) * 0.015;
        ctx.rotate(pitch);

        // Subtly glow the plane body
        ctx.shadowColor = "rgba(74, 222, 128, 0.3)";
        ctx.shadowBlur = 8;

        // Animated rotating nose propeller lines
        const propHeight = 5 + (t % 3) * 3;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(33, -propHeight);
        ctx.lineTo(33, propHeight);
        ctx.stroke();

        // Top Main Wing (perspective tilt)
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.moveTo(-8, -4);
        ctx.lineTo(6, -16);
        ctx.lineTo(13, -16);
        ctx.lineTo(3, -4);
        ctx.closePath();
        ctx.fill();

        // Fuselage (body gradient)
        const jetGrad = ctx.createLinearGradient(-20, 0, 30, 0);
        jetGrad.addColorStop(0, "#ef4444");
        jetGrad.addColorStop(0.7, "#dc2626");
        jetGrad.addColorStop(1, "#fecaca");
        ctx.fillStyle = jetGrad;
        
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.bezierCurveTo(-14, -8, 18, -8, 30, -2);
        ctx.bezierCurveTo(32, -1, 32, 1, 30, 2);
        ctx.bezierCurveTo(18, 8, -14, 8, -20, 0);
        ctx.closePath();
        ctx.fill();

        // Glowing blue Cockpit dome
        ctx.fillStyle = "rgba(147, 197, 253, 0.9)";
        ctx.beginPath();
        ctx.moveTo(6, -3);
        ctx.quadraticCurveTo(14, -6, 18, -2);
        ctx.quadraticCurveTo(12, 0, 6, -1);
        ctx.closePath();
        ctx.fill();

        // Red rudder tail fin
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.moveTo(-20, -1);
        ctx.lineTo(-25, -14);
        ctx.lineTo(-18, -14);
        ctx.lineTo(-13, -1);
        ctx.closePath();
        ctx.fill();

        // Bottom Main Wing (perspective overlay)
        ctx.fillStyle = "#047857";
        ctx.beginPath();
        ctx.moveTo(-4, 4);
        ctx.lineTo(7, 14);
        ctx.lineTo(13, 14);
        ctx.lineTo(3, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      } else {
        // Render bright camera flash on crash impact frame
        if (shockwaveRadius < 26) {
          const flash = Math.max(0, 1 - shockwaveRadius / 26);
          ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.8})`;
          ctx.fillRect(0, 0, w, h);
        }
      }

      t++;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden
    />
  );
}
