import type { Insight } from "../api/insights";
import { INSIGHT_TYPE_COLORS } from "../domain";
import type { OpenWoopFromInsight } from "../lib/insightWoop";
import { NEURAL_BG, NEURAL_CARD_BORDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

type WeekdayInsight = Extract<Insight, { type: "weekday" }>;

// "los lunes/martes/miércoles/jueves/viernes" ya funcionan en plural tal
// cual; solo sábado/domingo cambian de forma al pluralizar.
function pluralWeekday(label: string): string {
  if (label === "Sábado") return "sábados";
  if (label === "Domingo") return "domingos";
  return label.toLowerCase();
}

/** Tarjeta de "día débil": barras de cumplimiento por día de la semana (las
 * 7) con una línea punteada marcando el promedio general, para ver de un
 * vistazo cuánto se hunde el peor día frente al resto. */
export function InsightWeekdayCard({ insight, onOpenWoop }: { insight: WeekdayInsight; onOpenWoop?: OpenWoopFromInsight }) {
  const color = INSIGHT_TYPE_COLORS.weekday;
  const avgPct = Math.round(insight.rateOverall * 100);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border p-4" style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, borderLeft: `3px solid ${color}` }}>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm" style={{ background: `${color}26`, color }} aria-hidden>
          📅
        </span>
        <p className="text-sm font-semibold" style={{ color: NEURAL_TEXT }}>
          {insight.habitName}
        </p>
      </div>

      <p className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        {insight.summary}
      </p>

      <div className="relative flex h-24 items-end gap-1.5 pt-2">
        <div className="absolute left-0 right-0 border-t border-dashed" style={{ bottom: `${avgPct}%`, borderColor: NEURAL_TEXT_SECONDARY }} />
        {insight.byWeekday.map((d) => {
          const isWorst = d.label === insight.weekdayLabel;
          return (
            <div key={d.weekday} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-20 w-full items-end overflow-hidden rounded-t-md" style={{ background: NEURAL_CARD_BORDER }}>
                <div
                  className="w-full rounded-t-md"
                  style={{ height: `${Math.round(d.rate * 100)}%`, background: isWorst ? color : "rgba(124,92,255,0.18)" }}
                />
              </div>
              <span className="text-[10px]" style={{ color: isWorst ? color : NEURAL_TEXT_SECONDARY, fontWeight: isWorst ? 700 : 400 }}>
                {d.labelShort}
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          const obstacle = `"${insight.habitName}" se cae los ${pluralWeekday(insight.weekdayLabel)}`;
          onOpenWoop?.({
            title: insight.habitName,
            obstacle,
            sourceInsightType: "weekday",
            sourceInsightSummary: obstacle,
          });
        }}
        className="self-start rounded-full border px-3 py-1.5 text-xs font-bold"
        style={{ borderColor: color, color }}
      >
        Crear versión mínima para los {pluralWeekday(insight.weekdayLabel)}
      </button>
    </div>
  );
}
