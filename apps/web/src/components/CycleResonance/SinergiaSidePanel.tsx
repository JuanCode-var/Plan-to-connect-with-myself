import { BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREA_RGB } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import type { SynergyLink, SynergyNode } from "./sinergiasLogic";

/**
 * "Hábito seleccionado" (sección 4 del pedido) — nombre/área/%/ANCLA, la
 * barra con/sin si tiene `diff`, el mensaje según el caso (ya resuelto por
 * sinergiasLogic.ts, nunca recalculado acá) y los vecinos enlazados
 * ("Suele ir junto con"), tocables para cambiar la selección.
 */
export function SinergiaSidePanel({
  selected,
  links,
  nodesById,
  onSelect,
}: {
  selected: SynergyNode;
  links: SynergyLink[];
  nodesById: Map<string, SynergyNode>;
  onSelect: (id: string) => void;
}) {
  const color = BRAIN_AREA_COLOR[selected.area];

  const pals = links
    .filter((l) => l.a === selected.id || l.b === selected.id)
    .map((l) => ({ id: l.a === selected.id ? l.b : l.a, score: l.score }))
    .sort((x, y) => y.score - x.score)
    .map(({ id, score }) => ({ node: nodesById.get(id), score }))
    .filter((p): p is { node: SynergyNode; score: number } => !!p.node);

  return (
    <div
      className="flex h-full flex-col gap-3 rounded-[24px] p-6"
      style={{ background: "linear-gradient(170deg, rgba(124,92,255,0.14), rgba(255,255,255,0.03) 50%)", border: "1px solid rgba(196,181,253,0.35)" }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER, fontFamily: NEURAL_FONT_BODY }}>
        HÁBITO SELECCIONADO
      </span>
      <div className="flex flex-col gap-2">
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: "#FFFFFF" }}>{selected.name}</span>
        <div className="flex flex-wrap gap-2">
          <span style={{ fontSize: 12, fontWeight: 700, color: "#070B1F", padding: "4px 10px", borderRadius: 999, background: color }}>
            {BRAIN_AREA_LABEL[selected.area]}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#E6E9F5", padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)" }}>
            Cumplido {selected.percent} % del ciclo
          </span>
          {selected.isAnchor && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#070B1F", padding: "4px 10px", borderRadius: 999, background: "#FDE68A" }}>ANCLA</span>
          )}
        </div>
      </div>

      {selected.diff !== null && selected.withOthers !== null && selected.withoutOthers !== null && (
        <div className="flex flex-col gap-2.5 rounded-2xl" style={{ padding: "14px 16px", background: "rgba(253,230,138,0.06)", border: "1px solid rgba(253,230,138,0.35)" }}>
          <div className="flex items-baseline gap-2.5">
            <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 40, fontWeight: 700, lineHeight: 1, color: "#FDE68A" }}>
              {selected.diff >= 0 ? "+" : ""}
              {selected.diff}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#E6E9F5" }}>puntos de efecto arrastre</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5" style={{ fontSize: 13 }}>
              <span style={{ width: 92, color: "#E6E9F5" }}>Días con él</span>
              <div className="flex-grow" style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
                <div style={{ height: 8, borderRadius: 4, width: `${selected.withOthers}%`, background: "#FDE68A", boxShadow: "0 0 8px rgba(253,230,138,0.6)" }} />
              </div>
              <span style={{ width: 40, textAlign: "right", fontFamily: NEURAL_FONT_DISPLAY, fontWeight: 700, color: "#FFFFFF" }}>{selected.withOthers}%</span>
            </div>
            <div className="flex items-center gap-2.5" style={{ fontSize: 13 }}>
              <span style={{ width: 92, color: NEURAL_TEXT_SECONDARY }}>Días sin él</span>
              <div className="flex-grow" style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
                <div style={{ height: 8, borderRadius: 4, width: `${selected.withoutOthers}%`, background: "rgba(169,177,214,0.6)" }} />
              </div>
              <span style={{ width: 40, textAlign: "right", fontFamily: NEURAL_FONT_DISPLAY, fontWeight: 700, color: NEURAL_TEXT_SECONDARY }}>
                {selected.withoutOthers}%
              </span>
            </div>
          </div>
          <span style={{ fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>% del resto de tus hábitos que cumples ese día.</span>
        </div>
      )}

      <span style={{ fontSize: 14, lineHeight: 1.55, color: "#E6E9F5", fontFamily: NEURAL_FONT_BODY }}>{selected.message}</span>

      {pals.length > 0 && (
        <div className="flex flex-col gap-2">
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER, fontFamily: NEURAL_FONT_BODY }}>
            SUELE IR JUNTO CON
          </span>
          <div className="flex flex-wrap gap-2">
            {pals.map(({ node, score }) => {
              const pColor = BRAIN_AREA_COLOR[node.area];
              const pRgb = BRAIN_AREA_RGB[node.area];
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => onSelect(node.id)}
                  style={{
                    minHeight: 44,
                    padding: "0 12px",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontFamily: NEURAL_FONT_BODY,
                    fontSize: 13,
                    fontWeight: 600,
                    color: pColor,
                    background: `rgba(${pRgb},0.08)`,
                    border: `1px solid rgba(${pRgb},0.45)`,
                  }}
                >
                  {node.name} · {Math.round(score * 100)}%
                </button>
              );
            })}
          </div>
        </div>
      )}

      <span className="mt-auto" style={{ fontSize: 12, lineHeight: 1.45, color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY }}>
        Patrón, no causa: muestra qué hábitos suelen cumplirse el mismo día en tu historial.
      </span>
    </div>
  );
}
