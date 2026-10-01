import { useEffect, useRef } from "react";
import type { BackgroundScene } from "../lib/backgroundContext";

type Particle = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  phase: number;
  speed: number;
  drift: number;
  accent: boolean;
};

type ShootingStar = { x: number; y: number; vx: number; vy: number; life: number };

// Partículas por px² (con tope y piso en buildParticles) — suficientes para
// dar sensación de profundidad sin sobrecargar el canvas en pantallas grandes.
const DENSITY = 1 / 9000;

function readCssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * Fondo animado (canvas) para las 4 vistas principales: estrellas
 * parpadeando, un campo espacial a la deriva, o nieve cayendo — elección del
 * usuario vía BackgroundPicker (ver ProfileMenu.tsx), persistida en
 * BackgroundProvider. Vive como primer hijo de `<main>` (ver AppShell.tsx),
 * que tiene `position: relative; isolation: isolate` para aislar su propio
 * contexto de apilamiento — así el `z-index` negativo del canvas es
 * inequívoco (sin depender de cómo cada navegador ordena hijos de un
 * contenedor flex) y solo compite con lo que hay dentro de `<main>`. Las
 * superficies opacas (--surface) de tarjetas y tablas lo tapan con
 * normalidad; sidebar y header quedan fuera de `<main>`, así que nunca lo
 * muestran. Se ajusta con ResizeObserver al tamaño real del contenedor (no
 * al viewport), porque `<main>` puede crecer más que la pantalla con tablas
 * largas.
 *
 * Reutiliza --text-2 y --accent (nunca colores nuevos, ver convenciones del
 * proyecto) leyéndolos en vivo del DOM, así seguimos el tema claro/oscuro
 * sin duplicar lógica de theming acá.
 */
export function AnimatedBackground({ scene }: { scene: BackgroundScene }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const parent = canvas?.parentElement;
    if (!canvas || !ctx || !parent) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let shootingStar: ShootingStar | null = null;
    let raf = 0;

    function buildParticles() {
      const count = Math.min(180, Math.max(40, Math.round(width * height * DENSITY)));
      particles = Array.from({ length: count }, () => {
        const accent = Math.random() < 0.12;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r:
            scene === "snow"
              ? 1 + Math.random() * 2.2
              : accent
                ? 1.3 + Math.random() * 1.5
                : 0.6 + Math.random() * 1.2,
          alpha: 0.25 + Math.random() * 0.55,
          phase: Math.random() * Math.PI * 2,
          speed:
            scene === "space" ? 0.4 + Math.random() * 1.1 : scene === "snow" ? 0.5 + Math.random() * 1.2 : 0,
          drift: scene === "snow" ? 0.3 + Math.random() * 0.6 : 0.4 + Math.random() * 0.8,
          accent,
        };
      });
    }

    function resize() {
      width = parent!.clientWidth;
      height = parent!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    }

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(parent);

    const dimColor = readCssVar("--text-2", "#8b90a0");
    const accentColor = readCssVar("--accent", "#ffb020");

    function drawFrame(t: number) {
      ctx!.clearRect(0, 0, width, height);

      for (const p of particles) {
        let alpha = p.alpha;
        let x = p.x;
        let y = p.y;

        if (scene === "stars") {
          alpha = p.alpha * (0.5 + 0.5 * Math.sin(t * 0.0011 * p.drift + p.phase));
        } else if (scene === "space") {
          y = (p.y + t * p.speed * 0.02) % height;
          x = (p.x + t * p.speed * 0.006) % width;
        } else {
          y = (p.y + t * p.speed * 0.03) % height;
          x = ((p.x + Math.sin(t * 0.0015 + p.phase) * p.drift * 10) % width + width) % width;
        }

        ctx!.beginPath();
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = p.accent ? accentColor : dimColor;
        ctx!.shadowBlur = p.accent ? 6 : 0;
        ctx!.shadowColor = accentColor;
        ctx!.arc(x, y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (scene === "stars" && !reduceMotion) {
        if (!shootingStar && Math.random() < 0.0015) {
          shootingStar = {
            x: Math.random() * width * 0.6,
            y: Math.random() * height * 0.3,
            vx: 6 + Math.random() * 4,
            vy: 3 + Math.random() * 2,
            life: 1,
          };
        }
        if (shootingStar) {
          const s = shootingStar;
          ctx!.globalAlpha = s.life;
          ctx!.strokeStyle = accentColor;
          ctx!.lineWidth = 1.6;
          ctx!.shadowBlur = 0;
          ctx!.beginPath();
          ctx!.moveTo(s.x, s.y);
          ctx!.lineTo(s.x - s.vx * 6, s.y - s.vy * 6);
          ctx!.stroke();
          s.x += s.vx;
          s.y += s.vy;
          s.life -= 0.02;
          if (s.life <= 0 || s.x > width || s.y > height) shootingStar = null;
        }
      }

      ctx!.globalAlpha = 1;
      ctx!.shadowBlur = 0;
    }

    if (reduceMotion) {
      drawFrame(0);
    } else {
      const loop = (time: number) => {
        drawFrame(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      resizeObserver.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scene]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: -1 }}
    />
  );
}
