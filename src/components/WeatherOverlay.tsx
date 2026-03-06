"use client";
import { useRef, useEffect, useState } from "react";
import type { WeatherState, LavaBall } from "@/types";

interface Props {
  weather: WeatherState;
  lavaBalls: LavaBall[];
  windDirection: "left" | "right";
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; opacity: number; sway?: number;
}

export default function WeatherOverlay({ weather, lavaBalls, windDirection }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const snowCoverRef = useRef(0);
  const tumbleweedsRef = useRef<{x:number;y:number;r:number;rot:number;speed:number}[]>([]);
  const fogPhaseRef = useRef(0);
  const prevWeatherRef = useRef(weather);
  const [opacity, setOpacity] = useState(1);

  // Smooth transition on weather change
  useEffect(() => {
    if (prevWeatherRef.current !== weather) {
      setOpacity(0);
      const t = setTimeout(() => setOpacity(1), 50);
      prevWeatherRef.current = weather;
      particlesRef.current = [];
      snowCoverRef.current = 0;
      tumbleweedsRef.current = [];
      return () => clearTimeout(t);
    }
  }, [weather]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const W = 900;
    const H = 500;
    canvas.width = W;
    canvas.height = H;

    // Init tumbleweeds for wind
    if (weather === "wind" && tumbleweedsRef.current.length === 0) {
      for (let i = 0; i < 3; i++) {
        tumbleweedsRef.current.push({
          x: Math.random() * W,
          y: 350 + Math.random() * 100,
          r: 10 + Math.random() * 12,
          rot: 0,
          speed: 1.5 + Math.random() * 2,
        });
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      const p = particlesRef.current;

      if (weather === "rain") {
        // Spawn rain particles
        while (p.length < 100) {
          p.push({ x: Math.random() * W, y: Math.random() * -H, vx: -1.5, vy: 6 + Math.random() * 4, size: 2, opacity: 0.4 + Math.random() * 0.3 });
        }
        // Update + draw
        for (let i = p.length - 1; i >= 0; i--) {
          const pt = p[i];
          pt.x += pt.vx; pt.y += pt.vy;
          if (pt.y > H) {
            // Splash
            ctx.beginPath();
            ctx.arc(pt.x, H - 30 + Math.random() * 60, 3, 0, Math.PI, true);
            ctx.strokeStyle = `rgba(120,180,255,${pt.opacity * 0.5})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            pt.y = -10; pt.x = Math.random() * W;
          }
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.x + pt.vx * 2, pt.y + pt.vy * 2);
          ctx.strokeStyle = `rgba(120,180,255,${pt.opacity})`;
          ctx.lineWidth = pt.size;
          ctx.stroke();
        }
        // Shelter icons
        ctx.font = "22px serif";
        ctx.textAlign = "center";
      }

      if (weather === "snow") {
        while (p.length < 70) {
          p.push({
            x: Math.random() * W, y: Math.random() * -H,
            vx: 0, vy: 0.5 + Math.random() * 1,
            size: 2 + Math.random() * 4, opacity: 0.5 + Math.random() * 0.4,
            sway: Math.random() * Math.PI * 2,
          });
        }
        for (let i = p.length - 1; i >= 0; i--) {
          const pt = p[i];
          pt.sway = (pt.sway ?? 0) + 0.02;
          pt.x += Math.sin(pt.sway) * 0.5;
          pt.y += pt.vy;
          if (pt.y > H) {
            pt.y = -10; pt.x = Math.random() * W;
          }
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${pt.opacity})`;
          ctx.fill();
        }
        // Snow ground cover
        snowCoverRef.current = Math.min(snowCoverRef.current + 0.0005, 0.35);
        ctx.fillStyle = `rgba(255,255,255,${snowCoverRef.current})`;
        ctx.fillRect(0, H * 0.55, W, H * 0.45);
      }

      if (weather === "lava") {
        // Draw lava balls from state
        for (const ball of lavaBalls) {
          const r = 12 + Math.random() * 4;
          // Glow trail
          const grd = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, r * 2);
          grd.addColorStop(0, "rgba(255,100,0,0.6)");
          grd.addColorStop(1, "rgba(255,50,0,0)");
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, r * 2, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
          // Ball
          const ballGrd = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, r);
          ballGrd.addColorStop(0, "#ffcc00");
          ballGrd.addColorStop(0.5, "#ff6600");
          ballGrd.addColorStop(1, "#cc2200");
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
          ctx.fillStyle = ballGrd;
          ctx.fill();
        }
        // Warning flashes
        if (lavaBalls.length > 0 && Math.random() < 0.03) {
          ctx.fillStyle = "rgba(255,60,0,0.08)";
          ctx.fillRect(0, 0, W, H);
        }
      }

      if (weather === "wind") {
        const dir = windDirection === "right" ? 1 : -1;
        // Horizontal streaks
        while (p.length < 40) {
          p.push({
            x: dir > 0 ? -50 : W + 50,
            y: Math.random() * H,
            vx: dir * (4 + Math.random() * 6),
            vy: Math.random() * 0.5 - 0.25,
            size: 20 + Math.random() * 60,
            opacity: 0.08 + Math.random() * 0.12,
          });
        }
        for (let i = p.length - 1; i >= 0; i--) {
          const pt = p[i];
          pt.x += pt.vx; pt.y += pt.vy;
          if ((dir > 0 && pt.x > W + 60) || (dir < 0 && pt.x < -60)) {
            pt.x = dir > 0 ? -50 : W + 50;
            pt.y = Math.random() * H;
          }
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.x + pt.size * dir, pt.y);
          ctx.strokeStyle = `rgba(200,220,240,${pt.opacity})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        // Tumbleweeds
        const tw = tumbleweedsRef.current;
        for (const t of tw) {
          t.x += t.speed * dir;
          t.rot += 0.08 * dir;
          if (dir > 0 && t.x > W + 30) t.x = -30;
          if (dir < 0 && t.x < -30) t.x = W + 30;
          ctx.save();
          ctx.translate(t.x, t.y);
          ctx.rotate(t.rot);
          ctx.beginPath();
          ctx.arc(0, 0, t.r, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(139,90,43,0.7)";
          ctx.lineWidth = 2;
          ctx.stroke();
          // Inner lines
          for (let a = 0; a < 6; a++) {
            const angle = (a / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * t.r * 0.8, Math.sin(angle) * t.r * 0.8);
            ctx.strokeStyle = "rgba(139,90,43,0.4)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      if (weather === "fog") {
        fogPhaseRef.current += 0.008;
        const fogOpacity = 0.3 + Math.sin(fogPhaseRef.current) * 0.15;
        ctx.fillStyle = `rgba(180,190,200,${fogOpacity})`;
        ctx.fillRect(0, 0, W, H);
        // Lighter patches
        for (let i = 0; i < 4; i++) {
          const fx = 150 + i * 200 + Math.sin(fogPhaseRef.current + i) * 40;
          const fy = 200 + Math.sin(fogPhaseRef.current * 0.5 + i * 2) * 50;
          const grd = ctx.createRadialGradient(fx, fy, 0, fx, fy, 120);
          grd.addColorStop(0, `rgba(220,225,230,${fogOpacity * 0.5})`);
          grd.addColorStop(1, "rgba(220,225,230,0)");
          ctx.beginPath();
          ctx.arc(fx, fy, 120, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [weather, lavaBalls, windDirection]);

  if (weather === "clear") return null;

  return (
    <canvas
      ref={canvasRef}
      className="weather-canvas"
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 15,
        opacity, transition: "opacity 0.5s ease",
      }}
    />
  );
}
