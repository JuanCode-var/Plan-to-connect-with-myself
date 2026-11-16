import { BRAIN_AREA_COLOR, BRAIN_AREA_RGB } from "../NeuralCore/brainTokens";
import { NEURAL_CARD_BG, NEURAL_VIOLET_CARD_BORDER, NEURAL_FONT_BODY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import type { SynergyNode } from "./sinergiasLogic";

/**
 * "Efecto dominó sugerido" (sección 5 del pedido) — la cadena ya viene
 * armada por sinergiasLogic.ts (`buildDominoChain`); acá solo se dibuja, con
 * la frase final generada de los dos primeros nombres reales de la cadena
 * (nunca "dormir a tiempo"/"levantarte a las 6:30" del mockup, que eran
 * hábitos de ejemplo). Sin alto fijo ni scroll horizontal (el mockup
 * asumía nombres cortos de ejemplo — con nombres reales largos, una sola
 * fila de 96px los cortaba a la mitad con una barra de scroll visible): acá
 * las fichas se van a una línea nueva si hace falta y la tarjeta crece.
 */
export function SinergiaDominoStrip({ chain, selectedId, onSelect }: { chain: SynergyNode[]; selectedId: string | null; onSelect: (id: string) => void }) {
  if (chain.length < 2) return null;

  return (
    <div
      className="flex flex-col gap-4 rounded-[20px] p-5 lg:flex-row lg:items-center"
      style={{ boxSizing: "border-box", background: NEURAL_CARD_BG, border: `1px solid ${NEURAL_VIOLET_CARD_BORDER}` }}
    >
      <div className="flex w-full flex-col gap-1 lg:w-[220px] lg:flex-shrink-0">
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER, fontFamily: NEURAL_FONT_BODY }}>
          EFECTO DOMINÓ SUGERIDO
        </span>
        <span style={{ fontSize: 13, lineHeight: 1.4, color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY }}>
          Si cae la primera ficha, las demás suelen caer detrás.
        </span>
      </div>

      <div className="flex flex-grow flex-wrap items-center gap-y-2.5 gap-x-2.5">
        {chain.map((node, i) => {
          const on = node.id === selectedId;
          const color = BRAIN_AREA_COLOR[node.area];
          const rgb = BRAIN_AREA_RGB[node.area];
          return (
            <div key={node.id} className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onSelect(node.id)}
                title={node.name}
                style={{
                  height: 44,
                  maxWidth: 220,
                  padding: "0 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontFamily: NEURAL_FONT_BODY,
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: on ? "#070B1F" : color,
                  background: on ? color : `rgba(${rgb},0.08)`,
                  border: `1px solid rgba(${rgb},0.55)`,
                }}
              >
                {node.name}
              </button>
              {i < chain.length - 1 && (
                <svg aria-hidden="true" width="28" height="14" viewBox="0 0 28 14" style={{ flexShrink: 0 }}>
                  <path d="M2 7 L24 7 M18 2 L24 7 L18 12" fill="none" stroke="#FDE68A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      <span className="w-full lg:w-[260px] lg:flex-shrink-0" style={{ fontSize: 13, lineHeight: 1.45, color: "#FFFFFF", fontFamily: NEURAL_FONT_BODY }}>
        Empieza por la primera: <strong style={{ color: "#34D399" }}>{chain[0].name}</strong> hace más probable que sigas con {chain[1].name}.
      </span>
    </div>
  );
}
