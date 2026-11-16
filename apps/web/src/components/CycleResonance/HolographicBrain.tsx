import { useEffect, useRef, useState } from "react";
import { BRAIN_AREA_LABEL, type BrainArea } from "../NeuralCore/brainTokens";
import { cappedDevicePixelRatio, prefersReducedMotion } from "./resonanceCanvas";
import {
  BRAIN_LABEL_ORDER,
  BRAIN_REGION_META,
  BRAIN_VIEWS,
  buildBrain,
  makeProjector,
  REGION_ANCHOR,
  type Brain3DPoint,
  type BrainViewKey,
} from "./brainGeometry";
import type { ResonanceArea } from "./useCycleResonance";
import { NEURAL_FONT_BODY, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";

const SCAN_DURATION_MS = 2400;
const AUTOROTATE_RESUME_MS = 3500;
const AUTOROTATE_SPEED = 0.28; // rad/s
const VIEW_EASE = 0.08;

function percentFracOf(byArea: ResonanceArea[], area: BrainArea): number {
  const entry = byArea.find((a) => a.area === area);
  return (entry?.percent ?? 0) / 100;
}

/** null = sin hábitos todavía en esa área (distinto de "0% completado" con hábitos reales) — ver uso en la etiqueta flotante. */
function rawPercentOf(byArea: ResonanceArea[], area: BrainArea): number | null {
  return byArea.find((a) => a.area === area)?.percent ?? null;
}

/**
 * Cerebro holográfico 3D — puerto de la lógica de dibujo de Resonancia.dc.html
 * (ver brainGeometry.ts para la nube de puntos/proyección, ambas portadas
 * tal cual). Lo único que reemplaza datos fijos del mockup es el % real por
 * área (`byArea`, del servicio del paso 0) que alimenta el brillo de cada
 * punto y las etiquetas flotantes — la geometría en sí es procedural fija.
 */
export function HolographicBrain({
  byArea,
  cycleNumber,
  scanGeneration,
  onReplay,
}: {
  byArea: ResonanceArea[];
  cycleNumber: number | null;
  scanGeneration: number;
  onReplay: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeView, setActiveView] = useState<BrainViewKey | null>(null);
  // API imperativa hacia el loop de dibujo (vive dentro del efecto de
  // montaje) — un ref normal, no se "cuelgan" funciones del nodo DOM del
  // canvas (eso obligaría a castear `HTMLCanvasElement` con propiedades
  // inventadas en cada uso).
  const apiRef = useRef<{ pickView: (v: (typeof BRAIN_VIEWS)[number]) => void; replay: () => void } | null>(null);
  // `draw()` (dentro del efecto de montaje, más abajo) lee `byArea` a través
  // de este ref en vez de por closure directa — así el efecto de montaje
  // puede tener un array de dependencias vacío de verdad (monta la nube de
  // puntos y arranca el loop UNA sola vez) sin perder actualizaciones: si
  // `byArea` cambia (otro ciclo, un hábito recién marcado), el brillo del
  // cerebro lo refleja en el siguiente frame, sin reiniciar yaw/pitch/el
  // escaneo en curso.
  const byAreaRef = useRef(byArea);
  useEffect(() => {
    byAreaRef.current = byArea;
  }, [byArea]);

  const ariaLabel = `Cerebro holográfico en 3D del ciclo ${cycleNumber ?? "—"}: ${BRAIN_LABEL_ORDER.map((a) => {
    const entry = byArea.find((x) => x.area === a);
    return entry?.percent != null ? `${BRAIN_AREA_LABEL[a]} ${entry.percent}%` : `${BRAIN_AREA_LABEL[a]} sin hábitos`;
  }).join(", ")}. Arrastra para girarlo.`;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const reduceMotion = prefersReducedMotion();
    const dpr = cappedDevicePixelRatio();
    const pts: Brain3DPoint[] = buildBrain();

    let width = 0;
    let height = 0;
    function resize() {
      width = container!.clientWidth;
      height = container!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let yaw = -0.35;
    let pitch = 0.18;
    let target: [number, number] | null = null;
    let drag: { x: number; y: number } | null = null;
    let touched = 0;
    let scanStart = performance.now() + 400;
    let raf = 0;
    let paused = false;
    let last = performance.now();

    function handleReplay() {
      scanStart = performance.now();
    }

    function onDown(e: PointerEvent) {
      drag = { x: e.clientX, y: e.clientY };
      target = null;
      touched = performance.now();
      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        // Cortesía — algunos navegadores/táctiles no soportan captura de puntero.
      }
    }
    function onMove(e: PointerEvent) {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag = { x: e.clientX, y: e.clientY };
      yaw += dx * 0.01;
      pitch = Math.max(-1.4, Math.min(1.4, pitch + dy * 0.01));
      touched = performance.now();
      setActiveView(null);
    }
    function onUp() {
      drag = null;
      touched = performance.now();
    }

    function pickView(view: (typeof BRAIN_VIEWS)[number]) {
      const k = Math.round((yaw - view.yaw) / (Math.PI * 2));
      target = [view.yaw + k * Math.PI * 2, view.pitch];
      touched = performance.now() + 5000;
      setActiveView(view.key);
    }

    function draw(now: number) {
      if (!ctx) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!drag) {
        if (target) {
          yaw += (target[0] - yaw) * VIEW_EASE;
          pitch += (target[1] - pitch) * VIEW_EASE;
          if (Math.abs(target[0] - yaw) < 0.002 && Math.abs(target[1] - pitch) < 0.002) target = null;
        } else if (!reduceMotion && now - touched > AUTOROTATE_RESUME_MS) {
          yaw += dt * AUTOROTATE_SPEED;
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const proj = makeProjector(yaw, pitch, width, height);
      const st = reduceMotion ? 2 : (now - scanStart) / SCAN_DURATION_MS;
      const scanY = 1.0 - Math.max(0, Math.min(1, st)) * 2.25;
      const scanning = st >= 0 && st <= 1;

      ctx.globalCompositeOperation = "lighter";
      for (const p of pts) {
        const q = proj(p.x, p.y, p.z);
        const depth = Math.max(0, Math.min(1, (q[2] + 1.2) / 2.4));
        const meta = BRAIN_REGION_META[p.k];
        const v = p.k === "stem" ? 0.5 : percentFracOf(byAreaRef.current, p.k);
        let size = 1.0 + 1.4 * depth;
        if (scanning && Math.abs(p.y - scanY) < 0.05) {
          ctx.fillStyle = "rgba(165,243,252,0.95)";
          size *= 1.7;
        } else if (st < 0 || p.y < scanY) {
          ctx.fillStyle = `rgba(148,163,184,${(0.1 + 0.12 * depth).toFixed(3)})`;
        } else {
          ctx.fillStyle = `rgba(${meta.rgb},${((0.14 + 0.7 * v) * (0.45 + 0.55 * depth)).toFixed(3)})`;
        }
        ctx.fillRect(q[0] - size / 2, q[1] - size / 2, size, size);
      }

      ctx.globalCompositeOperation = "source-over";
      if (scanning) {
        ctx.beginPath();
        for (let i = 0; i <= 64; i++) {
          const a = (i / 64) * Math.PI * 2;
          const q = proj(Math.cos(a) * 1.25, scanY, Math.sin(a) * 0.95);
          if (i) ctx.lineTo(q[0], q[1]);
          else ctx.moveTo(q[0], q[1]);
        }
        ctx.fillStyle = "rgba(34,211,238,0.07)";
        ctx.fill();
        ctx.strokeStyle = "rgba(34,211,238,0.85)";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#22D3EE";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      const la = reduceMotion ? 1 : Math.max(0, Math.min(1, (st - 0.95) / 0.3));
      if (la > 0) {
        ctx.textAlign = "left";
        for (const k of BRAIN_LABEL_ORDER) {
          const meta = BRAIN_REGION_META[k];
          const anchor = REGION_ANCHOR[k];
          const q1 = proj(anchor[0], anchor[1] + 0.12, anchor[2]);
          const q2 = proj(anchor[0], anchor[1] + 0.12, -anchor[2]);
          const q = q1[2] > q2[2] ? q1 : q2;
          const rawPercent = rawPercentOf(byAreaRef.current, k);
          ctx.globalAlpha = la * Math.max(0.35, Math.min(1, q[2] + 0.6));
          ctx.fillStyle = meta.color;
          ctx.beginPath();
          ctx.arc(q[0], q[1], 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowColor = "#070B1F";
          ctx.shadowBlur = 6;
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "600 12px Inter, sans-serif";
          ctx.fillText(meta.label, q[0] + 8, q[1] - 3);
          ctx.fillStyle = meta.color;
          // `rawPercent === null` = sin hábitos todavía en esta área, distinto
          // de `0` (hay hábitos, 0% cumplido este ciclo) — ese caso SÍ debe
          // mostrar "0%", no confundirse con "sin hábitos aún".
          if (rawPercent !== null) {
            ctx.font = "700 17px 'Space Grotesk', sans-serif";
            ctx.fillText(`${rawPercent}%`, q[0] + 8, q[1] + 15);
          } else {
            ctx.font = "600 11px Inter, sans-serif";
            ctx.fillText("sin hábitos aún", q[0] + 8, q[1] + 12);
          }
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
      }
    }

    function loop(now: number) {
      if (paused) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function handleVisibility() {
      if (document.hidden) {
        paused = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (paused) {
        paused = false;
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    if (reduceMotion) draw(performance.now());
    else raf = requestAnimationFrame(loop);

    apiRef.current = { pickView, replay: handleReplay };

    return () => {
      apiRef.current = null;
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      if (raf) cancelAnimationFrame(raf);
    };
    // Dependencias vacías a propósito: este efecto monta la nube de puntos y
    // arranca el loop UNA sola vez. `draw()` lee el % de cada área a través
    // de `byAreaRef` (no por closure directa), así un cambio real de
    // `byArea` se refleja en el siguiente frame sin reconstruir el efecto —
    // reconstruirlo reiniciaría yaw/pitch/el escaneo de golpe cada vez que
    // los datos del ciclo se refrescan en segundo plano.
  }, []);

  const isFirstGenerationRef = useRef(true);
  useEffect(() => {
    if (isFirstGenerationRef.current) {
      isFirstGenerationRef.current = false;
      return;
    }
    apiRef.current?.replay();
  }, [scanGeneration]);

  return (
    <div>
      <div
        ref={containerRef}
        className="relative mx-auto w-full overflow-hidden rounded-[18px]"
        style={{
          maxWidth: 520,
          aspectRatio: "520 / 370",
          background: "radial-gradient(260px 200px at 50% 50%, rgba(124,92,255,0.16), transparent 75%)",
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={ariaLabel}
          style={{ width: "100%", height: "100%", display: "block", cursor: "grab", touchAction: "none" }}
        />
        <span
          className="pointer-events-none absolute right-3 top-2.5"
          style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, color: NEURAL_TEXT_SECONDARY }}
        >
          Arrastra para girar
        </span>
      </div>

      <div role="group" aria-label="Perspectiva del cerebro" className="mt-3 flex flex-wrap gap-2">
        {BRAIN_VIEWS.map((v) => {
          const isOn = activeView === v.key;
          return (
            <button
              key={v.key}
              type="button"
              aria-pressed={isOn}
              onClick={() => apiRef.current?.pickView(v)}
              style={{
                height: 44,
                padding: "0 16px",
                borderRadius: 12,
                fontFamily: NEURAL_FONT_BODY,
                fontSize: 13,
                fontWeight: 600,
                color: isOn ? "#070B1F" : "#C4B5FD",
                background: isOn ? "#C4B5FD" : "rgba(167,139,250,0.06)",
                border: "1px solid rgba(167,139,250,0.45)",
              }}
            >
              {v.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onReplay}
          className="flex items-center gap-2"
          style={{
            height: 44,
            padding: "0 16px",
            borderRadius: 12,
            background: "rgba(34,211,238,0.08)",
            border: "1px solid rgba(34,211,238,0.5)",
            color: "#22D3EE",
            fontFamily: NEURAL_FONT_BODY,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12 A9 9 0 1 0 6 5.3" />
            <path d="M3 4 L3 9 L8 9" />
          </svg>
          Repetir escaneo
        </button>
      </div>
    </div>
  );
}
