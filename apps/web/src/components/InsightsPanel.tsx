import { useInsights, type Insight } from "../api/insights";
import { INSIGHT_COLOR } from "../domain";

const INSIGHT_ICON: Record<Insight["type"], string> = {
  weekday: "📅",
  emotion: "💭",
  habit_pair: "🔗",
};

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  return (
    <li
      className="insight-in rounded-xl border p-3"
      style={{ background: "var(--bg)", borderColor: "var(--border)", borderLeft: `3px solid ${INSIGHT_COLOR}`, "--i": index } as React.CSSProperties}
    >
      <p className="text-sm" style={{ color: "var(--text)" }}>
        <span aria-hidden>{INSIGHT_ICON[insight.type]}</span> {insight.summary}
      </p>
    </li>
  );
}

/**
 * Fase 1 del "agente de insights" (ver conversación): patrones detectados
 * con estadística simple sobre el historial completo (HabitLog +
 * EmotionalEntry), calculados en apps/api/src/services/insights.ts — sin
 * IA todavía, eso queda para una fase 2 que redacte estos mismos datos de
 * forma más natural.
 */
export function InsightsPanel() {
  const { data, isLoading, isError } = useInsights();

  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <h2 className="font-display font-semibold" style={{ color: "var(--text)" }}>
        Patrones detectados
      </h2>

      {isLoading && <p style={{ color: "var(--text-2)" }}>Buscando patrones…</p>}
      {isError && <p className="text-red-500">No se pudieron calcular los patrones.</p>}

      {data && !data.enoughData && (
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Todavía no hay suficiente historial para detectar patrones de forma confiable
          (llevás {data.totalDays} de al menos {data.minDays} días).
        </p>
      )}

      {data && data.enoughData && data.insights.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Sin patrones fuertes por ahora — buena señal.
        </p>
      )}

      {data && data.insights.length > 0 && (
        <ul className="flex flex-col gap-2">
          {data.insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} index={i} />
          ))}
        </ul>
      )}
    </section>
  );
}
