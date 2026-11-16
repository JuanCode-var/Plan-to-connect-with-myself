import { Link } from "react-router-dom";
import { BRAIN_AREA_COLOR } from "../NeuralCore/brainTokens";
import { NEURAL_CYAN, NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import type { CaidaChain } from "./caidaChainLogic";
import type { OpenWoopFromInsight } from "../../lib/insightWoop";

const CHAIN_COLOR = "#FBBF24";

/**
 * "Cadena de caída" (ex "Patrones detectados", sección 3 del pedido) —
 * vive debajo de "Efecto dominó" en Sinergias. El ancla viene YA resuelta
 * de caidaChainLogic.ts (mismo módulo que las anclas de Sinergias, nunca
 * recalculada acá) — este componente solo dibuja.
 */
export function CaidaChainCard({
  chain,
  totalChains,
  onOpenWoop,
}: {
  chain: CaidaChain;
  totalChains: number;
  onOpenWoop?: OpenWoopFromInsight;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[20px] p-5" style={{ background: "rgba(255,255,255,0.03)", border: `1.5px solid ${CHAIN_COLOR}` }}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER, fontFamily: NEURAL_FONT_BODY }}>
          CADENA DE CAÍDA
        </span>
        {totalChains > 1 && (
          <Link to="/patrones" className="text-xs font-semibold" style={{ color: CHAIN_COLOR }}>
            Ver todas ({totalChains}) →
          </Link>
        )}
      </div>

      <p className="m-0" style={{ fontSize: 14, color: "#E6E9F5", fontFamily: NEURAL_FONT_BODY }}>
        {chain.summary}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        {chain.habitNames.map((name, i) => {
          const color = BRAIN_AREA_COLOR[chain.areas[i]];
          const prevColor = i > 0 ? BRAIN_AREA_COLOR[chain.areas[i - 1]] : null;
          return (
            <span key={name} className="flex items-center gap-1">
              {prevColor && <span aria-hidden style={{ width: 16, height: 2, background: `linear-gradient(90deg, ${prevColor}, ${color})` }} />}
              <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "rgba(255,255,255,0.08)", color, border: `1px solid ${color}` }}>
                {name}
              </span>
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="m-0" style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 30, fontWeight: 700, color: CHAIN_COLOR }}>
            {chain.coFailureDays}/{chain.sharedDays}
          </p>
          <p className="m-0" style={{ fontSize: 12, color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY }}>
            días compartidos
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {chain.dailyPattern.map((day) => (
            <span
              key={day.date}
              title={day.date}
              style={{ width: 14, height: 14, borderRadius: 3, background: day.allFailed ? CHAIN_COLOR : "rgba(255,255,255,0.08)" }}
            />
          ))}
        </div>
      </div>

      {chain.anchorId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-3" style={{ background: "rgba(251,191,36,0.08)" }}>
          <p className="m-0" style={{ fontSize: 14, color: "#E6E9F5", fontFamily: NEURAL_FONT_BODY }}>
            <span className="font-semibold">Posible hábito ancla:</span> {chain.anchorName}
          </p>
          <button
            type="button"
            onClick={() =>
              onOpenWoop?.({
                title: chain.anchorName ?? undefined,
                obstacle: chain.summary,
                sourceInsightType: "chain",
                sourceInsightSummary: chain.summary,
              })
            }
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ background: NEURAL_CYAN, color: "#070B1F" }}
          >
            Proteger este hábito
          </button>
        </div>
      )}
    </div>
  );
}
