import { useState, type ReactNode } from "react";
import { useCycles } from "../api/tracking";
import { useCycleComparison, useCycleSummary } from "../api/dashboard";
import { CycleSelector } from "../components/CycleSelector";
import { HabitCompletionBarChart } from "../components/HabitCompletionBarChart";
import { DailyTrendLineChart } from "../components/DailyTrendLineChart";
import { CycleComparisonChart } from "../components/CycleComparisonChart";
import { ProgressRing } from "../components/ProgressRing";

function formatDayMonth(dateISO: string): string {
  const [, month, day] = dateISO.split("-");
  return `${day}/${month}`;
}

/** Cantidad de días del ciclo (solo para el texto "X de Y días"; el cálculo
 * de % en sí nunca se reimplementa acá, siempre viene calculado del backend
 * — ver apps/api/src/services/tracking.ts). */
function totalCycleDays(startDateISO: string, endDateISO: string): number {
  const start = new Date(startDateISO).getTime();
  const end = new Date(endDateISO).getTime();
  return Math.round((end - start) / 86_400_000) + 1;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] tracking-wide uppercase" style={{ color: "var(--text-2)" }}>
        {label}
      </span>
      <span className="font-mono-num text-2xl font-semibold" style={{ color: "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}

function CounterChip({ value, label, tint }: { value: number; label: string; tint: string }) {
  return (
    <div
      className="flex min-w-[160px] flex-1 items-center gap-2.5 rounded-xl border p-3.5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div
        className="font-mono-num flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold"
        style={{ background: `${tint}26`, color: tint }}
      >
        {value}
      </div>
      <div className="text-xs leading-tight" style={{ color: "var(--text-2)" }}>
        {label}
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {children}
    </div>
  );
}

export function Dashboard() {
  const { data: cycles, isLoading: cyclesLoading, isError: cyclesError } = useCycles();
  // Mismo patrón que /tracker: `undefined` = "sin preferencia explícita
  // todavía", el ciclo activo por defecto se deriva en cada render a partir
  // de `isActive` (única fuente de verdad, calculada en el backend).
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>(undefined);

  const selectedCycleStillExists =
    !!selectedCycleId && !!cycles?.some((c) => c.id === selectedCycleId);
  const defaultCycleId =
    cycles && cycles.length > 0
      ? (cycles.find((c) => c.isActive) ?? cycles[cycles.length - 1]).id
      : undefined;
  const effectiveCycleId = selectedCycleStillExists ? selectedCycleId : defaultCycleId;
  const isActiveCycle = cycles?.find((c) => c.id === effectiveCycleId)?.isActive ?? false;

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useCycleSummary(effectiveCycleId);
  const {
    data: comparison,
    isLoading: comparisonLoading,
    isError: comparisonError,
  } = useCycleComparison();

  return (
    <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-2)" }}>
              {summary
                ? `${summary.cycle.name} · ${formatDayMonth(summary.cycle.startDate)} – ${formatDayMonth(summary.cycle.endDate)}`
                : "Panel de resumen"}
            </div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Panel de resumen</h1>
          </div>
          {cycles && cycles.length > 0 && (
            <div className="flex items-center gap-2">
              <CycleSelector cycles={cycles} selectedCycleId={effectiveCycleId} onChange={setSelectedCycleId} />
              {isActiveCycle && (
                <span
                  className="rounded-lg px-3 py-1.5 text-xs font-bold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  Activo
                </span>
              )}
            </div>
          )}
        </div>

        {cyclesLoading && <p style={{ color: "var(--text-2)" }}>Cargando ciclos…</p>}
        {cyclesError && <p className="text-red-500">No se pudieron cargar los ciclos.</p>}
        {!cyclesLoading && cycles && cycles.length === 0 && (
          <p style={{ color: "var(--text-2)" }}>Todavía no hay ciclos creados.</p>
        )}

        {effectiveCycleId && summaryLoading && <p style={{ color: "var(--text-2)" }}>Cargando resumen…</p>}
        {summaryError && <p className="text-red-500">No se pudo cargar el resumen del ciclo.</p>}

        {summary && (
          <>
            <Card className="flex flex-wrap items-center gap-6 sm:gap-10">
              <ProgressRing value={summary.completionRate} />
              <div className="flex flex-1 flex-wrap gap-6 sm:gap-10">
                <StatCard label="Cumplidos" value={summary.totals.done} />
                <StatCard label="Pendientes" value={summary.totals.pending} />
                <StatCard label="No aplica" value={summary.totals.na} />
              </div>
            </Card>

            <div className="flex flex-wrap gap-3">
              <CounterChip value={summary.counters.noBettingDays} label="días sin apuestas" tint="#C00000" />
              <CounterChip value={summary.counters.noAlcoholDays} label="días sin alcohol" tint="#C00000" />
              <CounterChip value={summary.counters.trainingDays} label="con entrenamiento" tint="#70AD47" />
              <CounterChip value={summary.counters.studyDays} label="con estudio" tint="#70AD47" />
              <CounterChip value={summary.counters.emotionalLogDays} label="registro emocional" tint="#E5B800" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Card className="overflow-x-auto">
                <h2 className="font-display mb-4 text-base font-semibold">% de cumplimiento por hábito</h2>
                <HabitCompletionBarChart byHabit={summary.byHabit} />
              </Card>

              <Card className="flex flex-col">
                <h2 className="font-display mb-1 text-base font-semibold">Tendencia diaria</h2>
                <p className="mb-3 text-xs" style={{ color: "var(--text-2)" }}>
                  Días transcurridos: {summary.byDay.length} de{" "}
                  {totalCycleDays(summary.cycle.startDate, summary.cycle.endDate)}
                </p>
                {summary.byDay.length > 0 ? (
                  <DailyTrendLineChart byDay={summary.byDay} />
                ) : (
                  <p style={{ color: "var(--text-2)" }}>Todavía no transcurrió ningún día de este ciclo.</p>
                )}
              </Card>
            </div>
          </>
        )}

        <Card>
          <h2 className="font-display mb-4 text-base font-semibold">Comparación entre ciclos</h2>
          {comparisonLoading && <p style={{ color: "var(--text-2)" }}>Cargando comparación…</p>}
          {comparisonError && (
            <p className="text-red-500">No se pudo cargar la comparación entre ciclos.</p>
          )}
          {comparison && comparison.length > 0 && <CycleComparisonChart cycles={comparison} />}
          {comparison && comparison.length === 0 && (
            <p style={{ color: "var(--text-2)" }}>Todavía no hay ciclos para comparar.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
