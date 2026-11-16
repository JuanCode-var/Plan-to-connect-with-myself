import { useEffect, useRef } from "react";
import { BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREA_RGB, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER } from "../NeuralCore/tokens";
import { ctrlFor, quad, type ConexionesLayout } from "./conexionesLayout";
import { cappedDevicePixelRatio, prefersReducedMotion } from "./resonanceCanvas";
import { CORE_R, HUB_R, MAP_CX, MAP_CY, MAP_H, MAP_W, RING_ORDER, SECTOR_R, TIER_RADIUS, TIERS_DESC } from "./conexionesTokens";

const GROW_MS = 1400;

function speedFor(percent: number): number {
  if (percent >= 100) return 0.55;
  if (percent >= 85) return 0.42;
  if (percent >= 60) return 0.28;
  return 0.2;
}

/**
 * Canvas + botones superpuestos del radial de "Mapa de conexiones" — puerto
 * de layout()/quad()/ctrlFor()/draw() de Conexiones.dc.html con datos reales
 * (`layout`, de conexionesLayout.ts). El canvas dibuja sectores, anillos,
 * dendritas e impulsos; los hubs/neuronas son botones HTML reales (igual que
 * el mockup, que tampoco hace hit-testing en el canvas) superpuestos en un
 * único `overlayRef` de 900×840 — mismo criterio ya probado en
 * HolographicBrain.tsx/EEGChart.tsx para que todo escale junto: un solo
 * `scale = ancho real / 900` aplicado a la vez al `ctx.setTransform` del
 * canvas Y, vía `transform: scale(...)`, a TODO el overlay HTML de encima,
 * así nunca se desincronizan entre sí sea cual sea el ancho real del
 * contenedor.
 */
export function ConexionesMap({
  layout,
  focusArea,
  onFocusArea,
  selectedIndex,
  onSelectIndex,
  percentGeneral,
}: {
  layout: ConexionesLayout;
  focusArea: BrainArea | null;
  onFocusArea: (area: BrainArea | null) => void;
  selectedIndex: number | null;
  onSelectIndex: (index: number) => void;
  percentGeneral: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // El loop de dibujo (dentro del efecto de montaje, deps vacías — se monta
  // una sola vez) lee estos valores por ref en vez de por closure directa,
  // mismo criterio que byAreaRef en HolographicBrain.tsx: así un cambio de
  // foco/selección/datos se refleja en el siguiente frame sin reiniciar la
  // animación de crecimiento de las dendritas cada vez.
  const layoutRef = useRef(layout);
  const focusAreaRef = useRef(focusArea);
  const selectedIndexRef = useRef(selectedIndex);
  const percentGeneralRef = useRef(percentGeneral);
  useEffect(() => {
    layoutRef.current = layout;
    focusAreaRef.current = focusArea;
    selectedIndexRef.current = selectedIndex;
    percentGeneralRef.current = percentGeneral;
  }, [layout, focusArea, selectedIndex, percentGeneral]);

  const ariaLabel = (() => {
    const counts = TIERS_DESC.map((t) => `${layout.nodes.filter((n) => n.habit.strength.key === t.key).length} ${t.label.toLowerCase()}`);
    const emptyAreas = RING_ORDER.filter((area) => layout.hubs[area].n === 0).map((area) => BRAIN_AREA_LABEL[area]);
    const base = `Mapa radial de ${layout.nodes.length} conexiones: ${counts.join(", ")}.`;
    return emptyAreas.length ? `${base} ${emptyAreas.join(" y ")} sin conexiones.` : base;
  })();

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!container || !canvas || !overlay) return;

    const reduceMotion = prefersReducedMotion();
    const dpr = cappedDevicePixelRatio();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let scale = 1;
    function resize() {
      width = container!.clientWidth;
      const height = container!.clientHeight;
      scale = width / MAP_W;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      overlay!.style.transform = `scale(${scale})`;
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const t0 = performance.now();
    let raf = 0;
    let paused = false;

    function draw(now: number) {
      if (!ctx) return;
      const L = layoutRef.current;
      const focus = focusAreaRef.current;
      const selN = selectedIndexRef.current !== null ? L.nodes[selectedIndexRef.current] ?? null : null;
      const T = (now - t0) / 1000;
      const grow = reduceMotion ? 1 : Math.min(1, (now - t0) / GROW_MS);
      const ease = 1 - Math.pow(1 - grow, 3);
      const fa = (k: BrainArea) => (!focus || focus === k ? 1 : 0.12);

      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      ctx.clearRect(0, 0, MAP_W, MAP_H);

      // Sectores por área
      RING_ORDER.forEach((area) => {
        const h = L.hubs[area];
        const rgb = BRAIN_AREA_RGB[area];
        ctx.beginPath();
        ctx.moveTo(MAP_CX, MAP_CY);
        ctx.arc(MAP_CX, MAP_CY, SECTOR_R, h.a0, h.a1);
        ctx.closePath();
        ctx.fillStyle = `rgba(${rgb},${focus === area ? 0.07 : 0.025})`;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(MAP_CX + 70 * Math.cos(h.a0), MAP_CY + 70 * Math.sin(h.a0));
        ctx.lineTo(MAP_CX + SECTOR_R * Math.cos(h.a0), MAP_CY + SECTOR_R * Math.sin(h.a0));
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Anillos de fuerza (de adentro hacia afuera)
      TIERS_DESC.forEach((t) => {
        const r = TIER_RADIUS[t.key];
        ctx.beginPath();
        ctx.arc(MAP_CX, MAP_CY, r, 0, Math.PI * 2);
        ctx.setLineDash(t.key === "poda" ? [3, 6] : [2, 5]);
        ctx.strokeStyle = t.key === "automatico" ? "rgba(253,230,138,0.22)" : "rgba(255,255,255,0.07)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Nombres de los anillos, escritos dentro del primer sector vacío (si hay uno) — si no hay, ya están en la leyenda inferior.
      const emptyHub = RING_ORDER.map((a) => L.hubs[a]).find((h) => h.n === 0);
      if (emptyHub) {
        ctx.font = "600 10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        TIERS_DESC.forEach((t) => {
          const r = TIER_RADIUS[t.key];
          const px = MAP_CX + r * Math.cos(emptyHub.mid);
          const py = MAP_CY + r * Math.sin(emptyHub.mid);
          ctx.fillStyle = t.key === "poda" ? "#A9B1D6" : t.color;
          ctx.globalAlpha = 0.85;
          ctx.fillText(t.label.toUpperCase(), px, py);
          ctx.globalAlpha = 1;
        });
      }

      // Núcleo -> hubs
      RING_ORDER.forEach((area) => {
        const h = L.hubs[area];
        const color = BRAIN_AREA_COLOR[area];
        const rgb = BRAIN_AREA_RGB[area];
        const ex = MAP_CX + (CORE_R + (HUB_R - CORE_R) * ease) * Math.cos(h.mid);
        const ey = MAP_CY + (CORE_R + (HUB_R - CORE_R) * ease) * Math.sin(h.mid);
        ctx.beginPath();
        ctx.moveTo(MAP_CX + CORE_R * Math.cos(h.mid), MAP_CY + CORE_R * Math.sin(h.mid));
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = `rgba(${rgb},${(h.n ? 0.75 : 0.25) * fa(area)})`;
        ctx.lineWidth = h.n ? 6 : 2;
        if (!h.n) ctx.setLineDash([4, 5]);
        ctx.shadowColor = color;
        ctx.shadowBlur = h.n ? 14 : 0;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
      });

      // Hubs -> neuronas (dendritas)
      L.nodes.forEach((n) => {
        const h = L.hubs[n.habit.area];
        const color = BRAIN_AREA_COLOR[n.habit.area];
        const rgb = BRAIN_AREA_RGB[n.habit.area];
        const c = ctrlFor(h, n);
        const poda = n.habit.strength.key === "poda";
        const isSel = selN === n;
        const steps = 24;
        const lim = Math.max(1, Math.round(steps * ease));
        ctx.beginPath();
        ctx.moveTo(h.x, h.y);
        for (let s = 1; s <= lim; s++) {
          const p = quad(h.x, h.y, c[0], c[1], n.x, n.y, s / steps);
          ctx.lineTo(p[0], p[1]);
        }
        const alpha = poda ? 0.45 : 0.22 + (0.68 * n.habit.percent) / 100;
        ctx.strokeStyle = poda ? `rgba(100,116,139,${alpha * fa(n.habit.area)})` : `rgba(${rgb},${alpha * fa(n.habit.area)})`;
        ctx.lineWidth = isSel ? 4.5 : poda ? 1.2 : 1 + (3.5 * n.habit.percent) / 100;
        if (poda) ctx.setLineDash([3, 5]);
        ctx.shadowColor = color;
        ctx.shadowBlur = (n.habit.percent >= 85 || isSel) && fa(n.habit.area) === 1 ? 10 : 0;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
      });

      // Impulsos núcleo -> hub -> neurona (Sendero o superior; Chispa/En poda solo si está seleccionada)
      if (grow >= 1) {
        ctx.globalCompositeOperation = "lighter";
        L.nodes.forEach((n) => {
          const tierKey = n.habit.strength.key;
          if ((tierKey === "poda" || tierKey === "chispa") && selN !== n) return;
          const f = fa(n.habit.area);
          if (f < 1 && selN !== n) return;
          const h = L.hubs[n.habit.area];
          const rgb = BRAIN_AREA_RGB[n.habit.area];
          const c = ctrlFor(h, n);
          const speed = speedFor(n.habit.percent);
          const count = n.habit.percent >= 100 ? 2 : 1;
          for (let m = 0; m < count; m++) {
            let t = (T * speed + n.phase + m / count) % 1;
            if (reduceMotion) t = 0.7;
            let px: number, py: number;
            if (t < 0.25) {
              const u = t / 0.25;
              const r = CORE_R + (HUB_R - CORE_R) * u;
              px = MAP_CX + r * Math.cos(h.mid);
              py = MAP_CY + r * Math.sin(h.mid);
            } else {
              const p = quad(h.x, h.y, c[0], c[1], n.x, n.y, (t - 0.25) / 0.75);
              px = p[0];
              py = p[1];
            }
            const g = ctx.createRadialGradient(px, py, 0, px, py, 9);
            g.addColorStop(0, "rgba(255,255,255,0.95)");
            g.addColorStop(0.35, `rgba(${rgb},0.8)`);
            g.addColorStop(1, `rgba(${rgb},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(px, py, 9, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.globalCompositeOperation = "source-over";
      }

      // Núcleo
      const pulse = reduceMotion ? 0 : Math.sin(T * 2.2) * 3;
      const cg = ctx.createRadialGradient(MAP_CX, MAP_CY, 0, MAP_CX, MAP_CY, CORE_R + 30 + pulse);
      cg.addColorStop(0, "rgba(124,92,255,0.55)");
      cg.addColorStop(0.55, "rgba(34,211,238,0.18)");
      cg.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(MAP_CX, MAP_CY, CORE_R + 30 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(MAP_CX, MAP_CY, CORE_R, 0, Math.PI * 2);
      ctx.fillStyle = "#120E33";
      ctx.fill();
      ctx.strokeStyle = "rgba(196,181,253,0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(MAP_CX, MAP_CY, CORE_R + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (percentGeneralRef.current / 100) * ease);
      ctx.strokeStyle = "#22D3EE";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.shadowColor = "#22D3EE";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineCap = "butt";

      // Halo de la neurona seleccionada
      if (selN) {
        const rr = 14 + (reduceMotion ? 0 : (Math.sin(T * 4) + 1) * 3);
        ctx.beginPath();
        ctx.arc(selN.x, selN.y, rr, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
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
        raf = requestAnimationFrame(loop);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    if (reduceMotion) draw(performance.now());
    else raf = requestAnimationFrame(loop);

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (raf) cancelAnimationFrame(raf);
    };
    // Deps vacías a propósito, igual que HolographicBrain.tsx: el loop arranca
    // una sola vez y lee foco/selección/datos vía refs — así no se reinicia
    // la animación de crecimiento cada vez que algo cambia.
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-[24px]"
      style={{
        maxWidth: MAP_W,
        aspectRatio: `${MAP_W} / ${MAP_H}`,
        background: "radial-gradient(circle at 50% 50%, rgba(124,92,255,0.10), rgba(255,255,255,0.02) 60%)",
        border: "1px solid rgba(139,92,246,0.28)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
      }}
    >
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel} style={{ position: "absolute", left: 0, top: 0, display: "block" }} />

      <div ref={overlayRef} style={{ position: "absolute", left: 0, top: 0, width: MAP_W, height: MAP_H, transformOrigin: "0 0" }}>
        <div
          style={{
            position: "absolute",
            left: MAP_CX - 50,
            top: MAP_CY - 50,
            width: 100,
            height: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>{percentGeneral}%</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: NEURAL_LAVENDER, marginTop: 4 }}>TU NÚCLEO</span>
        </div>

        {RING_ORDER.map((area) => {
          const h = layout.hubs[area];
          const color = BRAIN_AREA_COLOR[area];
          const rgb = BRAIN_AREA_RGB[area];
          const on = focusArea === area;
          return (
            <button
              key={area}
              type="button"
              aria-pressed={on}
              aria-label={`Iluminar ${BRAIN_AREA_LABEL[area]}${h.n ? `, promedio ${h.avg} %` : ", sin hábitos"}`}
              onClick={() => onFocusArea(on ? null : area)}
              style={{
                position: "absolute",
                left: h.x - 48,
                top: h.y - 22,
                width: 96,
                height: 44,
                boxSizing: "border-box",
                borderRadius: 14,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                color,
                background: on ? `rgba(${rgb},0.28)` : "rgba(7,11,31,0.85)",
                border: `${h.n ? "1px solid" : "1px dashed"} rgba(${rgb},${on ? 1 : 0.6})`,
                boxShadow: on ? `0 0 18px rgba(${rgb},0.55)` : "none",
                opacity: focusArea && !on ? 0.4 : 1,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700 }}>{BRAIN_AREA_LABEL[area]}</span>
              <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
                {h.n ? `${h.avg}%` : "sin conexiones"}
              </span>
            </button>
          );
        })}

        {layout.nodes.map((n, idx) => {
          const color = BRAIN_AREA_COLOR[n.habit.area];
          const poda = n.habit.strength.key === "poda";
          const on = idx === selectedIndex;
          const dim = focusArea && focusArea !== n.habit.area;
          const size = Math.round(7 + (9 * n.habit.percent) / 100);
          return (
            <button
              key={n.habit.id}
              type="button"
              className="cx-hit"
              aria-pressed={on}
              aria-label={`${n.habit.name}, ${BRAIN_AREA_LABEL[n.habit.area]}, ${n.habit.percent} %, ${n.habit.strength.label}`}
              onClick={() => onSelectIndex(idx)}
              style={{
                position: "absolute",
                left: n.x - 15,
                top: n.y - 15,
                width: 30,
                height: 30,
                background: "transparent",
                border: 0,
                padding: 0,
                margin: 0,
                cursor: "pointer",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                className="cx-dot"
                style={{
                  display: "block",
                  width: size,
                  height: size,
                  boxSizing: "border-box",
                  borderRadius: "50%",
                  background: poda ? "#0E1330" : n.habit.percent === 100 ? `radial-gradient(circle at 35% 35%, #FFFFFF 0, ${color} 70%)` : color,
                  border: poda ? "1.5px solid #64748B" : n.habit.priority === "ALTA" ? "2px solid #FFFFFF" : "0",
                  boxShadow: poda ? "none" : `0 0 ${n.habit.percent >= 85 ? 14 : 6}px ${color}`,
                  opacity: dim ? 0.15 : 1,
                  transition: "transform .2s ease, opacity .3s ease",
                }}
              />
            </button>
          );
        })}

        {(() => {
          const selN = selectedIndex !== null ? layout.nodes[selectedIndex] ?? null : null;
          const visible = focusArea
            ? layout.nodes.filter((n) => n.habit.area === focusArea)
            : selN
              ? [selN]
              : [];
          return visible.map((n) => {
            const strong = n === selN;
            const right = Math.cos(n.ang) >= 0;
            return (
              <span
                key={n.habit.id}
                style={{
                  position: "absolute",
                  top: n.y - 9,
                  width: 190,
                  fontSize: 12,
                  fontWeight: strong ? 700 : 500,
                  lineHeight: "18px",
                  color: strong ? "#FFFFFF" : "#E6E9F5",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  pointerEvents: "none",
                  textShadow: "0 0 6px #070B1F, 0 0 6px #070B1F, 0 0 6px #070B1F",
                  left: right ? n.x + 14 : n.x - 204,
                  textAlign: right ? "left" : "right",
                }}
              >
                {n.habit.name}
              </span>
            );
          });
        })()}

        <div
          style={{
            position: "absolute",
            left: 18,
            bottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "12px 14px",
            borderRadius: 14,
            background: "rgba(7,11,31,0.72)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER, fontFamily: NEURAL_FONT_BODY }}>
            ANILLOS · DE ADENTRO HACIA AFUERA
          </span>
          {TIERS_DESC.map((t) => (
            <span key={t.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#E6E9F5", fontFamily: NEURAL_FONT_BODY }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  boxSizing: "border-box",
                  background: t.key === "poda" ? "transparent" : t.color,
                  border: t.key === "poda" ? "1.5px dashed #A9B1D6" : "0",
                }}
              />
              <span style={{ width: 74 }}>{t.label}</span>
              <strong style={{ fontFamily: NEURAL_FONT_DISPLAY, color: "#FFFFFF" }}>
                {layout.nodes.filter((n) => n.habit.strength.key === t.key).length}
              </strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
