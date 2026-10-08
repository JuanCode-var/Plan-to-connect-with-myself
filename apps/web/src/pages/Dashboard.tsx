import { useState, type ReactNode } from "react";
import { useCycleLogs, useCycles } from "../api/tracking";
import type { HabitLog } from "../api/tracking";
import { useCycleComparison, useCycleSummary } from "../api/dashboard";
import { CycleSelector } from "../components/CycleSelector";
import { HabitCompletionBarChart } from "../components/HabitCompletionBarChart";
import { CategoryCompletionChart } from "../components/CategoryCompletionChart";
import { InsightsPanel } from "../components/InsightsPanel";
import { DailyTrendLineChart } from "../components/DailyTrendLineChart";
import { CycleComparisonChart } from "../components/CycleComparisonChart";
import { ProgressRing } from "../components/ProgressRing";
import { FlameIcon } from "../components/FlameIcon";
import { SectionPager } from "../components/SectionPager";
import { HABIT_CATEGORY_LABELS, HABIT_PRIORITY_COLORS, type HabitCategory, type HabitPriorityLevel, type LogStatus } from "../domain";
import { toDateOnlyISO } from "../lib/completion";
import { todayISO } from "../lib/date";
import { firstName } from "../lib/greeting";
import { calculatePerfectDayStreak } from "../lib/streak";
import { useAuth } from "../lib/useAuth";
import { useCountUp } from "../lib/useCountUp";

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

function buildLogLookup(logs: HabitLog[]): Map<string, LogStatus> {
  const map = new Map<string, LogStatus>();
  for (const log of logs) {
    map.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
  }
  return map;
}

/** Mensaje que abre el resumen, calibrado a lo que realmente se logró en
 * este ciclo — no un genérico "¡bien hecho!" siempre igual. La idea es que
 * al entrar a /dashboard la persona sienta que el número que ve tiene una
 * lectura, no que es solo una estadística fría. */
function motivationalHeadline(rate: number, totalDone: number, name: string | undefined): string {
  const who = name ? `, ${name}` : "";
  if (totalDone === 0) return `Este ciclo recién empieza${who} — cada hábito marcado es el primer ladrillo.`;
  if (rate >= 0.9) return `Impecable${who}. Estás dominando este ciclo de punta a punta.`;
  if (rate >= 0.7) return `Vas muy sólido${who}. Este nivel de constancia es el que compone con el tiempo.`;
  if (rate >= 0.4) return `Estás construyendo algo real${who} — cada marca en verde suma más de lo que parece.`;
  return `Todavía hay ciclo por delante${who}. Un hábito hoy ya cambia la tendencia.`;
}

function StatCard({ label, value }: { label: string; value: number }) {
  const animated = useCountUp(value);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] tracking-wide uppercase" style={{ color: "var(--text-2)" }}>
        {label}
      </span>
      <span className="font-mono-num text-2xl font-semibold" style={{ color: "var(--text)" }}>
        {animated}
      </span>
    </div>
  );
}

/** `${tint}26` (~15% alpha) solo funciona con hex literal — HABIT_PRIORITY_COLORS.MEDIA
 * es la string "var(--accent)", no un hex, así que ahí usamos el
 * --accent-soft ya definido en vez de concatenarle un sufijo inválido. */
function softTint(color: string): string {
  return color === "var(--accent)" ? "var(--accent-soft)" : `${color}26`;
}

function CounterChip({ value, label, tint }: { value: number; label: string; tint: string }) {
  const animated = useCountUp(value);
  return (
    <div
      className="panel-card flex min-w-[160px] flex-1 items-center gap-2.5 rounded-xl border p-3.5"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div
        className="font-mono-num flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold"
        style={{ background: softTint(tint), color: tint }}
      >
        {animated}
      </div>
      <div className="text-xs leading-tight" style={{ color: "var(--text-2)" }}>
        {label}
      </div>
    </div>
  );
}

function Card({
  children,
  className = "",
  delay = 0,
  accent,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Franja de color arriba (mismo lenguaje que Hábitos/Biblioteca/Diario):
   * solo para las tarjetas de "insight" (resumen, mejor hábito), no para las
   * de gráficos — esas ya son densas en datos y no necesitan el marco de
   * nota destacada. */
  accent?: string;
}) {
  return (
    <div
      className={`panel-card panel-card-in rounded-2xl border p-5 ${accent ? "mosaic-card pt-6" : ""} ${className}`}
      style={
        {
          background: "var(--surface)",
          borderColor: "var(--border)",
          animationDelay: `${delay}ms`,
          ...(accent ? { "--tile-accent": accent } : {}),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
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

  // Misma query que /tracker y /welcome (cache compartida por queryKey): se
  // usa acá solo para la racha de días perfectos, que no viene en el
  // /dashboard/:cycleId del backend.
  const { data: cycleLogs } = useCycleLogs(effectiveCycleId);
  let perfectStreak = 0;
  if (cycleLogs) {
    const lookup = buildLogLookup(cycleLogs.logs);
    const effectiveStatus = (habitId: string, date: string): LogStatus =>
      lookup.get(`${habitId}|${date}`) ?? "PENDING";
    perfectStreak = calculatePerfectDayStreak(cycleLogs.habits, cycleLogs.days, effectiveStatus, todayISO());
  }

  const bestHabit = summary?.byHabit.reduce<CycleSummaryHabit | undefined>((best, habit) => {
    if (!best || habit.completionRate > best.completionRate) return habit;
    return best;
  }, undefined);

  const [chartSection, setChartSection] = useState<ChartSection>("habit");

  return (
    <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ color: "var(--text)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-2)" }}>
              {summary
                ? `${summary.cycle.name} · ${formatDayMonth(summary.cycle.startDate)} – ${formatDayMonth(summary.cycle.endDate)}`
                : "Panel de resumen"}
            </div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Resumen</h1>
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

        <InsightsPanel />

        {cyclesLoading && <p style={{ color: "var(--text-2)" }}>Cargando ciclos…</p>}
        {cyclesError && <p className="text-red-500">No se pudieron cargar los ciclos.</p>}
        {!cyclesLoading && cycles && cycles.length === 0 && (
          <p style={{ color: "var(--text-2)" }}>Todavía no hay ciclos creados.</p>
        )}

        {effectiveCycleId && summaryLoading && <p style={{ color: "var(--text-2)" }}>Cargando resumen…</p>}
        {summaryError && <p className="text-red-500">No se pudo cargar el resumen del ciclo.</p>}

        {summary && (
          <>
            <Card accent="var(--accent)" className="flex flex-wrap items-center gap-6 sm:gap-10">
              <ProgressRing value={summary.completionRate} />
              <div className="flex min-w-[240px] flex-1 flex-col gap-3">
                <p className="font-display text-lg font-bold sm:text-xl">
                  {motivationalHeadline(summary.completionRate, summary.totals.done, user ? firstName(user.name) : undefined)}
                </p>
                <div className="flex flex-wrap gap-6 sm:gap-10">
                  <StatCard label="Cumplidos" value={summary.totals.done} />
                  <StatCard label="Pendientes" value={summary.totals.pending} />
                  <StatCard label="No aplica" value={summary.totals.na} />
                </div>
              </div>
              {perfectStreak >= 2 && (
                <div
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold"
                  style={{ background: "rgba(217,119,6,0.18)", color: "#92400E" }}
                  title={`${perfectStreak} días perfectos seguidos`}
                >
                  <FlameIcon size={16} />
                  {perfectStreak} días perfectos
                </div>
              )}
            </Card>

            {bestHabit && bestHabit.completionRate > 0 && (
              <Card
                delay={60}
                accent={HABIT_PRIORITY_COLORS[bestHabit.priority]}
                className="flex items-center gap-3"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-bold"
                  style={{
                    background: softTint(HABIT_PRIORITY_COLORS[bestHabit.priority]),
                    color: HABIT_PRIORITY_COLORS[bestHabit.priority],
                  }}
                >
                  ★
                </span>
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  Tu hábito más sólido este ciclo es{" "}
                  <strong style={{ color: "var(--text)" }}>{bestHabit.name}</strong>
                  {" "}({HABIT_CATEGORY_LABELS[bestHabit.category]}), con{" "}
                  <strong style={{ color: "var(--text)" }}>{Math.round(bestHabit.completionRate * 100)}%</strong> de cumplimiento.
                </p>
              </Card>
            )}

            <div className="flex flex-wrap gap-3">
              <CounterChip
                value={summary.counters.noBettingDays}
                label="días sin apuestas"
                tint={HABIT_PRIORITY_COLORS.ALTA}
              />
              <CounterChip
                value={summary.counters.noAlcoholDays}
                label="días sin alcohol"
                tint={HABIT_PRIORITY_COLORS.ALTA}
              />
              <CounterChip
                value={summary.counters.trainingDays}
                label="con entrenamiento"
                tint={HABIT_PRIORITY_COLORS.MEDIA}
              />
              <CounterChip
                value={summary.counters.studyDays}
                label="con estudio"
                tint={HABIT_PRIORITY_COLORS.MEDIA}
              />
              <CounterChip
                value={summary.counters.emotionalLogDays}
                label="registro emocional"
                tint={HABIT_PRIORITY_COLORS.MEDIA}
              />
            </div>

            <SectionPager
              sections={CHART_SECTIONS}
              labels={CHART_SECTION_LABELS}
              active={chartSection}
              onChange={setChartSection}
              panels={{
              habit: (
                <Card>
                  <h2 className="font-display mb-4 text-base font-semibold">% de cumplimiento por hábito</h2>
                  <HabitCompletionBarChart byHabit={summary.byHabit} />
                </Card>
              ),
              category: (
                <Card>
                  <h2 className="font-display mb-4 text-base font-semibold">% de cumplimiento por área de vida</h2>
                  <CategoryCompletionChart byHabit={summary.byHabit} />
                </Card>
              ),
              trend: (
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
              ),
              comparison: (
                <Card>
                  <h2 className="font-display mb-4 text-base font-semibold">Comparación entre ciclos</h2>
                  {comparisonLoading && <p style={{ color: "var(--text-2)" }}>Cargando comparación…</p>}
                  {comparisonError && <p className="text-red-500">No se pudo cargar la comparación entre ciclos.</p>}
                  {comparison && comparison.length > 0 && <CycleComparisonChart cycles={comparison} />}
                  {comparison && comparison.length === 0 && (
                    <p style={{ color: "var(--text-2)" }}>Todavía no hay ciclos para comparar.</p>
                  )}
                </Card>
              ),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

const CHART_SECTIONS = ["habit", "category", "trend", "comparison"] as const;
type ChartSection = (typeof CHART_SECTIONS)[number];
const CHART_SECTION_LABELS: Record<ChartSection, string> = {
  habit: "Por hábito",
  category: "Por área de vida",
  trend: "Tendencia diaria",
  comparison: "Comparación entre ciclos",
};

type CycleSummaryHabit = { id: string; name: string; category: HabitCategory; priority: HabitPriorityLevel; completionRate: number };
