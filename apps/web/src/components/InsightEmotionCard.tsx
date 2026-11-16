import type { Insight } from "../api/insights";
import { INSIGHT_TYPE_COLORS } from "../domain";
import type { OpenWoopFromInsight } from "../lib/insightWoop";
import { NEURAL_BG, NEURAL_CARD_BORDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

type EmotionInsight = Extract<Insight, { type: "emotion" }>;

/** Tarjeta de "emoción": dos barras horizontales comparando el cumplimiento
 * general en días con esa emoción registrada vs. el resto de los días. */
export function InsightEmotionCard({ insight, onOpenWoop }: { insight: EmotionInsight; onOpenWoop?: OpenWoopFromInsight }) {
  const color = INSIGHT_TYPE_COLORS.emotion;
  const onPct = Math.round(insight.rateOnEmotionDays * 100);
  const otherPct = Math.round(insight.rateOtherDays * 100);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border p-4" style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, borderLeft: `3px solid ${color}` }}>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm" style={{ background: `${color}26`, color }} aria-hidden>
          💭
        </span>
        <p className="text-sm font-semibold capitalize" style={{ color: NEURAL_TEXT }}>
          {insight.emotion}
        </p>
      </div>

      <p className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        {insight.summary}
      </p>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
            <span>Días con &quot;{insight.emotion}&quot;</span>
            <span className="font-mono-num font-bold" style={{ color }}>
              {onPct}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full" style={{ background: NEURAL_CARD_BORDER }}>
            <div className="h-full rounded-full" style={{ width: `${onPct}%`, background: color }} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
            <span>Resto de los días</span>
            <span className="font-mono-num font-bold" style={{ color: NEURAL_TEXT }}>
              {otherPct}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full" style={{ background: NEURAL_CARD_BORDER }}>
            <div className="h-full rounded-full" style={{ width: `${otherPct}%`, background: "rgba(124,92,255,0.18)" }} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpenWoop?.({ obstacle: insight.summary, sourceInsightType: "emotion", sourceInsightSummary: insight.summary })}
        className="self-start rounded-full border px-3 py-1.5 text-xs font-bold"
        style={{ borderColor: color, color }}
      >
        Preparar plan para días de &quot;{insight.emotion}&quot;
      </button>
    </div>
  );
}
