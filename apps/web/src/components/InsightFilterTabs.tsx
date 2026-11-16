import type { Insight } from "../api/insights";
import { NEURAL_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

export type InsightFilter = "all" | "chain" | "weekday" | "emotion";

const FILTER_LABELS: Record<InsightFilter, string> = {
  all: "Todos",
  weekday: "Días débiles",
  emotion: "Emociones",
  chain: "En cadena",
};

/**
 * Pestañas de filtro con contador por tipo — filtran el array completo de
 * insights ANTES de que InsightsPanel decida qué va destacado, qué a la
 * grilla y qué a la lista compacta (cambiar de filtro puede cambiar cuál es
 * "lo más fuerte" dentro del subconjunto elegido).
 */
export function InsightFilterTabs({
  insights,
  active,
  onChange,
}: {
  insights: Insight[];
  active: InsightFilter;
  onChange: (filter: InsightFilter) => void;
}) {
  const counts: Record<InsightFilter, number> = {
    all: insights.length,
    weekday: insights.filter((i) => i.type === "weekday").length,
    emotion: insights.filter((i) => i.type === "emotion").length,
    chain: insights.filter((i) => i.type === "chain").length,
  };

  const options = (["all", "weekday", "emotion", "chain"] as const).filter((f) => f === "all" || counts[f] > 0);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((filter) => {
        const isActive = active === filter;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
            style={{
              background: isActive ? NEURAL_CYAN : NEURAL_BG,
              borderColor: isActive ? NEURAL_CYAN : NEURAL_CARD_BORDER,
              color: isActive ? NEURAL_BG : NEURAL_TEXT_SECONDARY,
            }}
          >
            {FILTER_LABELS[filter]} · {counts[filter]}
          </button>
        );
      })}
    </div>
  );
}
