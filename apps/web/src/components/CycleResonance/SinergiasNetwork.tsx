import { useEffect, useMemo, useRef } from "react";
import { BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREA_RGB, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY } from "../NeuralCore/tokens";
import { NET_H, NET_W } from "./sinergiasLayout";
import { synergyNodeSize, type SynergyLink, type SynergyNode } from "./sinergiasLogic";

/**
 * La red de 880×600 (sección 1/2/3 del pedido) — enlaces y nodos son divs
 * HTML absolutamente posicionados en coordenadas de DISEÑO fijas (NET_W×
 * NET_H), metidos en un solo `overlayRef` al que se le aplica
 * `transform: scale(ancho real / 880)`; mismo truco ya probado en
 * ConexionesMap.tsx (ahí hacía falta además sincronizar un canvas — acá no
 * hay canvas, así que es más simple todavía: un solo wrapper, una sola
 * escala).
 */
export function SinergiasNetwork({
  nodes,
  links,
  positions,
  selectedId,
  onSelect,
}: {
  nodes: SynergyNode[];
  links: SynergyLink[];
  positions: Map<string, { x: number; y: number }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;
    function resize() {
      overlay!.style.transform = `scale(${container!.clientWidth / NET_W})`;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const neighborsOfSelected = useMemo(() => {
    const set = new Set<string>();
    if (!selectedId) return set;
    for (const l of links) {
      if (l.a === selectedId) set.add(l.b);
      if (l.b === selectedId) set.add(l.a);
    }
    return set;
  }, [links, selectedId]);

  const areasPresent = useMemo(() => {
    const seen = new Set<BrainArea>();
    const ordered: BrainArea[] = [];
    for (const n of nodes) {
      if (!seen.has(n.area)) {
        seen.add(n.area);
        ordered.push(n.area);
      }
    }
    return ordered;
  }, [nodes]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-[24px]"
      style={{ maxWidth: NET_W, aspectRatio: `${NET_W} / ${NET_H}`, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.28)", boxShadow: "0 30px 80px rgba(0,0,0,0.45)" }}
    >
      <div ref={overlayRef} style={{ position: "absolute", left: 0, top: 0, width: NET_W, height: NET_H, transformOrigin: "0 0" }}>
        <div className="absolute left-5 top-4 flex flex-wrap gap-3.5" style={{ fontSize: 12, color: "#A9B1D6", fontFamily: NEURAL_FONT_BODY }}>
          {areasPresent.map((area) => (
            <span key={area} className="flex items-center gap-1.5">
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: BRAIN_AREA_COLOR[area] }} />
              {BRAIN_AREA_LABEL[area]}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span style={{ width: 12, height: 12, boxSizing: "border-box", borderRadius: "50%", border: "2px solid #FDE68A" }} />
            Ancla
          </span>
        </div>

        <div aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, width: NET_W, height: NET_H }}>
          {links.map((link) => {
            const a = positions.get(link.a);
            const b = positions.get(link.b);
            const nodeA = nodes.find((n) => n.id === link.a);
            const nodeB = nodes.find((n) => n.id === link.b);
            if (!a || !b || !nodeA || !nodeB) return null;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const on = link.a === selectedId || link.b === selectedId;
            const h = 1.5 + link.score * 4;
            return (
              <div
                key={`${link.a}-${link.b}`}
                className="sy-link"
                style={{
                  position: "absolute",
                  left: a.x,
                  top: a.y - h / 2,
                  width: len,
                  height: h,
                  borderRadius: h,
                  transform: `rotate(${Math.atan2(dy, dx)}rad)`,
                  transformOrigin: "0 50%",
                  background: `linear-gradient(90deg, ${BRAIN_AREA_COLOR[nodeA.area]}, ${BRAIN_AREA_COLOR[nodeB.area]})`,
                  opacity: selectedId ? (on ? 0.95 : 0.1) : 0.55,
                  boxShadow: on ? "0 0 10px rgba(253,230,138,0.45)" : "none",
                  transition: "opacity .35s ease, box-shadow .35s ease",
                }}
              />
            );
          })}
        </div>

        {nodes.map((n) => {
          const pos = positions.get(n.id);
          if (!pos) return null;
          const color = BRAIN_AREA_COLOR[n.area];
          const rgb = BRAIN_AREA_RGB[n.area];
          const isSelected = n.id === selectedId;
          const isNear = isSelected || neighborsOfSelected.has(n.id);
          const size = synergyNodeSize(n.diff);
          const hit = Math.max(44, size + 8);
          return (
            <div
              key={n.id}
              className="sy-node absolute flex flex-col items-center gap-0.5"
              style={{ left: pos.x - 70, top: pos.y - hit / 2, width: 140, opacity: selectedId ? (isNear ? 1 : 0.32) : 1 }}
            >
              <button
                type="button"
                className={`sy-hit ${isSelected ? "sy-live" : ""}`}
                aria-pressed={isSelected}
                aria-label={`${n.name}, ${BRAIN_AREA_LABEL[n.area]}${n.diff !== null ? `, efecto arrastre +${n.diff} puntos` : ", siempre cumplido"}${n.isAnchor ? ", hábito ancla" : ""}`}
                onClick={() => onSelect(n.id)}
                style={{ width: hit, height: hit, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <span
                  style={{
                    display: "block",
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    boxSizing: "border-box",
                    background:
                      n.diff === null
                        ? `radial-gradient(circle, rgba(${rgb},0.35), rgba(${rgb},0.12))`
                        : `radial-gradient(circle at 35% 35%, #FFFFFF 0, ${color} 45%, rgba(${rgb},0.6) 100%)`,
                    border: n.diff === null ? `2px dashed rgba(${rgb},0.8)` : "0",
                    outline: n.isAnchor ? "3px solid #FDE68A" : isSelected ? "2px solid #FFFFFF" : "none",
                    outlineOffset: 3,
                    boxShadow: `0 0 ${isSelected ? 26 : 14}px rgba(${rgb},${isSelected ? 0.9 : 0.6})`,
                  }}
                />
              </button>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "#FFFFFF" : "#E6E9F5",
                  textAlign: "center",
                  lineHeight: 1.25,
                  textShadow: "0 0 6px #070B1F, 0 0 6px #070B1F",
                  fontFamily: NEURAL_FONT_BODY,
                }}
              >
                {n.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
