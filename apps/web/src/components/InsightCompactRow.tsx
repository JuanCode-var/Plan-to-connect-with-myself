import type { Insight } from "../api/insights";
import { INSIGHT_TYPE_COLORS } from "../domain";
import { NEURAL_BG, NEURAL_CARD_BORDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

const ICON: Record<"weekday" | "emotion", string> = { weekday: "📅", emotion: "💭" };

/** Fila genérica de "Más patrones" para weekday/emotion (chain usa
 * InsightChainCard con featured=false — tiene su propio tratamiento de
 * chips, este es el fallback para lo que no entró en la grilla de 2). */
export function InsightCompactRow({ insight }: { insight: Extract<Insight, { type: "weekday" | "emotion" }> }) {
  const color = INSIGHT_TYPE_COLORS[insight.type];
  const fraction = insight.type === "weekday" ? insight.rateOnWeekday : insight.rateOnEmotionDays;
  const pct = Math.round(fraction * 100);

  return (
    <li
      className="flex items-center gap-3 rounded-xl border p-3"
      style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, borderLeft: `3px solid ${color}` }}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm" style={{ background: `${color}26`, color }} aria-hidden>
        {ICON[insight.type]}
      </span>
      <p className="min-w-0 flex-1 truncate text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        {insight.summary}
      </p>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-mono-num text-sm font-bold" style={{ color: NEURAL_TEXT }}>
          {pct}%
        </span>
        <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: NEURAL_CARD_BORDER }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    </li>
  );
}
