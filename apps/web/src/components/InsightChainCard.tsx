import type { Insight } from "../api/insights";
import { INSIGHT_TYPE_COLORS } from "../domain";
import type { OpenWoopFromInsight } from "../lib/insightWoop";
import { NEURAL_BG, NEURAL_CARD_BORDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

type ChainInsight = Extract<Insight, { type: "chain" }>;

/**
 * Tarjeta de "cadena" de hábitos que caen juntos — con prop `featured` para
 * alternar entre la versión grande (chips conectados + heatmap + callout de
 * hábito ancla, para el lugar destacado) y una fila compacta (para la lista
 * "Más patrones"), sin duplicar el markup de cadenas en dos componentes.
 */
export function InsightChainCard({
  insight,
  featured,
  onOpenWoop,
}: {
  insight: ChainInsight;
  featured: boolean;
  onOpenWoop?: OpenWoopFromInsight;
}) {
  const color = INSIGHT_TYPE_COLORS.chain;

  if (!featured) {
    return (
      <li
        className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
        style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, borderLeft: `3px solid ${color}` }}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm" style={{ background: `${color}26`, color }} aria-hidden>
          🔗
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            {insight.habitNames.map((name) => (
              <span
                key={name}
                className="truncate rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ background: `${color}1a`, color, maxWidth: "11rem" }}
              >
                {name}
              </span>
            ))}
          </div>
          <p className="mt-1 truncate text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
            {insight.summary}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono-num text-sm font-bold" style={{ color: NEURAL_TEXT }}>
            {insight.coFailureDays}/{insight.sharedDays}
          </span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: NEURAL_CARD_BORDER }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.round((insight.coFailureDays / insight.sharedDays) * 100)}%`, background: color }}
            />
          </div>
        </div>
      </li>
    );
  }

  const heatmap = insight.dailyPattern;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border p-4" style={{ background: NEURAL_BG, borderColor: color, borderWidth: 1.5 }}>
      <div className="flex flex-wrap items-center gap-1.5">
        {insight.habitNames.map((name, i) => (
          <span key={name} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden style={{ color }}>
                —
              </span>
            )}
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: `${color}1f`, color }}
            >
              {name}
            </span>
          </span>
        ))}
      </div>

      <p className="text-sm" style={{ color: NEURAL_TEXT }}>
        {insight.summary}
      </p>

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="font-mono-num text-3xl font-bold" style={{ color }}>
            {insight.coFailureDays}/{insight.sharedDays}
          </p>
          <p className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
            días compartidos
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          {heatmap.map((day) => (
            <span
              key={day.date}
              title={day.date}
              className="h-3.5 w-3.5 rounded-sm"
              style={{ background: day.allFailed ? color : NEURAL_CARD_BORDER }}
            />
          ))}
        </div>
      </div>

      {insight.anchor && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-3" style={{ background: `${color}14` }}>
          <p className="text-sm" style={{ color: NEURAL_TEXT }}>
            <span className="font-semibold">Posible hábito ancla:</span> {insight.anchor.habitName} — es el que más
            seguido falla por su cuenta dentro de este grupo.
          </p>
          <button
            type="button"
            onClick={() =>
              onOpenWoop?.({
                title: insight.anchor?.habitName,
                obstacle: insight.summary,
                sourceInsightType: "chain",
                sourceInsightSummary: insight.summary,
              })
            }
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ background: color, color: "white" }}
          >
            Proteger este hábito
          </button>
        </div>
      )}
    </div>
  );
}
