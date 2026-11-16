import { useMemo } from "react";
import { useCycleComparison, useCycleSummary, type CycleSummary } from "../../api/dashboard";
import { useCycles } from "../../api/tracking";
import type { LogStatus } from "../../domain";
import { todayISO } from "../../lib/date";
import { AREA_OF_CATEGORY, BRAIN_AREAS, BRAIN_AREA_LABEL, type BrainArea } from "../NeuralCore/brainTokens";
import { habitStrengthFor } from "./resonanceTokens";

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function toLocalDate(dateOnlyISO: string): Date {
  const [y, m, d] = dateOnlyISO.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Días inclusive entre dos fechas "YYYY-MM-DD" (o ISO completo, se recorta). */
function daysBetweenInclusive(startISO: string, endISO: string): number {
  const diff = toLocalDate(dateOnly(endISO)).getTime() - toLocalDate(dateOnly(startISO)).getTime();
  return Math.round(diff / 86400000) + 1;
}

/** Día actual del ciclo (1-based), recortado a [0, totalDays] — 0 si el ciclo todavía no empezó. */
function elapsedDayNumber(startISO: string, totalDays: number): number {
  const diff = toLocalDate(todayISO()).getTime() - toLocalDate(dateOnly(startISO)).getTime();
  const raw = Math.round(diff / 86400000) + 1;
  return Math.max(0, Math.min(raw, totalDays));
}

export type ResonanceHabit = CycleSummary["byHabit"][number] & {
  area: BrainArea;
  percent: number;
  strength: ReturnType<typeof habitStrengthFor>;
};

export type ResonanceArea = { area: BrainArea; label: string; percent: number | null; habitCount: number };

export type ResonancePastCycle = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  completionRate: number;
  cycleNumber: number;
  totalDays: number;
  /** `false` = el ciclo existe pero no tiene un solo HabitLog — "Versiones de ti" lo muestra como tarjeta fantasma, nunca con un % inventado. */
  hasData: boolean;
  byArea: ResonanceArea[];
};

/** % por hábito -> `ResonanceHabit[]` (área real + % redondeado + etapa de fuerza). Un solo lugar, usado tanto para el ciclo actual como para cada ciclo pasado (`pastCycles`, abajo) — "Versiones de ti" lo necesita para los dos. */
export function enrichByHabit(rawByHabit: CycleSummary["byHabit"]): ResonanceHabit[] {
  return rawByHabit.map((h) => {
    const percent = Math.round(h.completionRate * 100);
    return { ...h, area: AREA_OF_CATEGORY[h.category], percent, strength: habitStrengthFor(percent) };
  });
}

/** `ResonanceHabit[]` de UN ciclo -> promedio real por área (null = el área no tiene hábitos, nunca 0% inventado). Mismo criterio para el ciclo actual y para cada ciclo pasado. */
export function computeByArea(byHabit: ResonanceHabit[]): ResonanceArea[] {
  return BRAIN_AREAS.map((area) => {
    const habitsInArea = byHabit.filter((h) => h.area === area);
    if (habitsInArea.length === 0) return { area, label: BRAIN_AREA_LABEL[area], percent: null, habitCount: 0 };
    const avg = habitsInArea.reduce((sum, h) => sum + h.completionRate, 0) / habitsInArea.length;
    return { area, label: BRAIN_AREA_LABEL[area], percent: Math.round(avg * 100), habitCount: habitsInArea.length };
  });
}

/**
 * Capa de datos de "Resonancia del ciclo" — NO pide nada nuevo salvo
 * `habitLogs` (agregado a GET /api/dashboard/:cycleId, costo ~0 porque esos
 * logs ya se leían server-side para calcular byHabit/byDay/counters, ver
 * apps/api/src/routes/dashboard.ts). Todo lo demás reutiliza los hooks que
 * ya alimentan el Dashboard actual (useCycleSummary/useCycleComparison) y
 * useCycles() del Tracker, sin duplicar lógica de cálculo — el % general,
 * por hábito y por día siguen viniendo tal cual los calcula el backend
 * (services/tracking.ts), esta capa solo los REAGRUPA para el nuevo diseño
 * (por área, con fuerza del hábito, con número de ciclo).
 *
 * Gaps reales (documentados, no rellenados con datos falsos):
 * - `pastCycles[].byArea` viene de `/dashboard/compare` (ampliado para
 *   "Versiones de ti" con `byHabit`/`hasData` por ciclo, ver
 *   apps/api/src/routes/dashboard.ts) — un ciclo con `hasData: false` no
 *   tiene un solo HabitLog real, nunca se le inventa un %.
 * - `habitLogs` es el historial crudo día-por-hábito tal cual lo devuelve
 *   el backend — "Sinergias" tendrá que cruzarlo (qué hábitos coinciden el
 *   mismo día), no se precalcula acá para no adivinar qué forma necesita
 *   esa pantalla todavía sin construir.
 */
export function useCycleResonance(cycleId: string | undefined) {
  const { data: cycles } = useCycles();
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useCycleSummary(cycleId);
  const { data: comparison } = useCycleComparison();

  // Ningún ciclo guarda un "número" propio (confirmado: Cycle no tiene
  // columna de secuencia) — se deriva de la posición en la lista ordenada
  // por fecha de inicio, 1-based. `useCycles()` no garantiza ese orden por
  // sí solo (a diferencia de /dashboard/compare, que si lo documenta), así
  // que se ordena acá antes de buscar el índice.
  const cyclesByStart = useMemo(
    () => (cycles ? [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate)) : undefined),
    [cycles],
  );
  const cycleNumber = useMemo(() => {
    if (!cyclesByStart || !summary) return null;
    const index = cyclesByStart.findIndex((c) => c.id === summary.cycle.id);
    return index === -1 ? null : index + 1;
  }, [cyclesByStart, summary]);

  const totalDays = summary ? daysBetweenInclusive(summary.cycle.startDate, summary.cycle.endDate) : 0;
  const currentDay = summary ? elapsedDayNumber(summary.cycle.startDate, totalDays) : 0;

  const byHabit: ResonanceHabit[] = useMemo(() => (summary ? enrichByHabit(summary.byHabit) : []), [summary]);

  // Promedio simple de completionRate por hábito, sin ponderar — mismo
  // criterio que usaba el extinto CategoryCompletionChart.tsx (reemplazado
  // por esta sección), reagrupado acá por BrainArea en vez de HabitCategory.
  // Un área sin ningún hábito da `percent: null` (no 0%) — "sin datos" no es lo
  // mismo que "incumplido".
  const byArea: ResonanceArea[] = useMemo(() => computeByArea(byHabit), [byHabit]);

  const pastCycles: ResonancePastCycle[] = useMemo(() => {
    if (!comparison) return [];
    return comparison.map((c, index) => ({
      id: c.id,
      name: c.name,
      startDate: c.startDate,
      endDate: c.endDate,
      completionRate: c.completionRate,
      cycleNumber: index + 1,
      totalDays: daysBetweenInclusive(c.startDate, c.endDate),
      hasData: c.hasData,
      byArea: computeByArea(enrichByHabit(c.byHabit)),
    }));
  }, [comparison]);

  const habitLogs = summary?.habitLogs ?? [];
  const habitLogLookup = useMemo(() => {
    const map = new Map<string, LogStatus>();
    for (const log of habitLogs) map.set(`${log.habitId}|${dateOnly(log.date)}`, log.status);
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);
  function statusOf(habitId: string, dateISO: string): LogStatus {
    return habitLogLookup.get(`${habitId}|${dateOnly(dateISO)}`) ?? "PENDING";
  }

  return {
    cycle: summary?.cycle,
    cycleNumber,
    totalCyclesCount: cycles?.length ?? 0,
    currentDay,
    totalDays,
    completado: summary?.totals.done ?? 0,
    pendiente: summary?.totals.pending ?? 0,
    noAplica: summary?.totals.na ?? 0,
    percentGeneral: summary ? Math.round(summary.completionRate * 100) : 0,
    counters: summary?.counters,
    byHabit,
    byArea,
    byDay: summary?.byDay ?? [],
    pastCycles,
    habitLogs,
    statusOf,
    isLoading: summaryLoading,
    isError: summaryError,
  };
}
