import { useState } from "react";
import { Link } from "react-router-dom";
import { useInsights, type Insight } from "../api/insights";
import { CompactItem, FeaturedCard } from "../components/insightDisplay";
import { InsightFilterTabs, type InsightFilter } from "../components/InsightFilterTabs";
import { SectionIntro } from "../components/SectionIntro";
import { WoopFlow } from "../components/WoopFlow";
import { insightKey } from "../lib/insightKey";
import type { OpenWoopFromInsight } from "../lib/insightWoop";
import { NEURAL_CYAN, NEURAL_CYAN_SOFT, NEURAL_BG, NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../components/NeuralCore/tokens";

function SearchPatternIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M12.6 12.6L17 17" />
    </svg>
  );
}

/**
 * Vista entera de "Patrones detectados" (día de semana, emoción, cadena) —
 * página propia (ruta /patrones), con todo el historial del usuario, no
 * solo el ciclo activo. El Resumen ya no trae un adelanto de esto: la
 * "cadena" más fuerte del CICLO ACTUAL vive integrada en Sinergias (ver
 * CaidaChainCard.tsx dentro de CycleResonance/SinergiasTab.tsx, con su
 * propio cálculo cycle-scoped) con un link "Ver todas →" que trae acá
 * cuando hay más de una — esta página sigue siendo el lugar para ver TODOS
 * los patrones (día de semana y emoción incluidos, que Sinergias no cubre).
 */
export function Patrones() {
  const { data, isLoading, isError } = useInsights();
  const [filter, setFilter] = useState<InsightFilter>("all");
  const [woopPrefill, setWoopPrefill] = useState<Parameters<OpenWoopFromInsight>[0] | null>(null);
  const onOpenWoop: OpenWoopFromInsight = (args) => setWoopPrefill(args);

  return (
    <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ background: NEURAL_BG, color: NEURAL_TEXT }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: NEURAL_CYAN_SOFT, color: NEURAL_CYAN }}
            >
              <SearchPatternIcon />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: NEURAL_TEXT }}>
                Patrones detectados
              </h1>
              {data && (
                <p className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  Basado en tus últimos {data.totalDays} días · se recalcula al abrir el Resumen
                </p>
              )}
            </div>
          </div>
          <Link to="/dashboard" className="text-sm font-semibold" style={{ color: NEURAL_CYAN }}>
            ← Volver al Resumen
          </Link>
        </div>

        <SectionIntro
          id="patrones"
          purpose="Estadística simple sobre tu propio historial (sin IA) para ver lo que no salta a la vista."
          steps={["Hace falta un mínimo de 15 días de historial.", "\"Lo más fuerte\" es siempre lo más notable.", "Los filtros de arriba acotan por tipo."]}
          benefit="Ganas enterarte de algo real sobre tu propio comportamiento que nadie te señaló."
          colors={{
            bg: "rgba(255,255,255,0.04)",
            border: NEURAL_CARD_BORDER,
            text: NEURAL_TEXT,
            textMuted: NEURAL_TEXT_SECONDARY,
            accent: NEURAL_CYAN,
            accentSoft: NEURAL_CYAN_SOFT,
          }}
        />

        {isLoading && <p style={{ color: NEURAL_TEXT_SECONDARY }}>Buscando patrones…</p>}
        {isError && <p className="text-red-500">No se pudieron calcular los patrones.</p>}

        {data && !data.enoughData && (
          <div className="flex flex-col gap-2">
            <p className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Todavía no hay suficiente historial para detectar patrones de forma confiable
              (llevas {data.totalDays} de al menos {data.minDays} días).
            </p>
            <div className="h-2 max-w-sm overflow-hidden rounded-full" style={{ background: NEURAL_CARD_BORDER }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.round((data.totalDays / data.minDays) * 100)}%`, background: NEURAL_CYAN }}
              />
            </div>
          </div>
        )}

        {data && data.enoughData && data.insights.length === 0 && (
          <div className="flex items-center gap-3 rounded-xl border p-4" style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER }}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base" style={{ background: NEURAL_CYAN_SOFT, color: NEURAL_CYAN }} aria-hidden>
              ✓
            </span>
            <p className="text-sm" style={{ color: NEURAL_TEXT }}>
              Sin patrones fuertes por ahora — buena señal.
            </p>
          </div>
        )}

        {data && data.enoughData && data.insights.length > 0 && (
          <PatronesResults insights={data.insights} filter={filter} onFilterChange={setFilter} onOpenWoop={onOpenWoop} />
        )}
      </div>

      {woopPrefill && (
        <WoopFlow
          onClose={() => setWoopPrefill(null)}
          initialTitle={woopPrefill.title}
          initialObstacle={woopPrefill.obstacle}
          sourceInsightType={woopPrefill.sourceInsightType}
          sourceInsightSummary={woopPrefill.sourceInsightSummary}
        />
      )}
    </div>
  );
}

function PatronesResults({
  insights,
  filter,
  onFilterChange,
  onOpenWoop,
}: {
  insights: Insight[];
  filter: InsightFilter;
  onFilterChange: (filter: InsightFilter) => void;
  onOpenWoop: OpenWoopFromInsight;
}) {
  const filtered = filter === "all" ? insights : insights.filter((i) => i.type === filter);
  const [featured, ...rest] = filtered;
  const bestWeekday = rest.find((i) => i.type === "weekday");
  const bestEmotion = rest.find((i) => i.type === "emotion");
  const gridItems = [bestWeekday, bestEmotion].filter((i): i is NonNullable<typeof i> => Boolean(i));
  const compactAll = rest.filter((i) => i !== bestWeekday && i !== bestEmotion);

  return (
    <div className="flex flex-col gap-6">
      <InsightFilterTabs insights={insights} active={filter} onChange={onFilterChange} />

      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          No hay patrones de este tipo por ahora.
        </p>
      ) : (
        <>
          <div>
            <p className="mb-2 text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Lo más fuerte
            </p>
            <FeaturedCard insight={featured} onOpenWoop={onOpenWoop} />
          </div>

          {gridItems.length > 0 && (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
              {gridItems.map((insight) => (
                <FeaturedCard key={insightKey(insight)} insight={insight} onOpenWoop={onOpenWoop} />
              ))}
            </div>
          )}

          {compactAll.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Más patrones ({compactAll.length})
              </p>
              <ul className="flex flex-col gap-2">
                {compactAll.map((insight) => (
                  <CompactItem key={insightKey(insight)} insight={insight} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
