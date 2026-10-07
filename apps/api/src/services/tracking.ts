// Cálculo de % de cumplimiento y agrupaciones fila/columna para la matriz de
// /tracker. Reutilizado por apps/api/src/routes/cycles.ts y, más adelante, por
// el dashboard (sección 6) — por eso vive acá y no dentro de routes/cycles.ts.
import { todayLocalISO } from "../date-utils";

/**
 * % de cumplimiento = DONE / (DONE + PENDING). Las celdas `NA` (o no contables,
 * ver isDateCountableForHabit) se excluyen del numerador y del denominador. Si
 * el denominador es 0 el resultado es 0, nunca NaN.
 *
 * Misma fórmula que en apps/web/src/lib/completion.ts — si cambiás una, cambiá
 * la otra.
 */
export function calculateCompletionRate(statuses: string[]): number {
  let done = 0;
  let pending = 0;
  for (const status of statuses) {
    if (status === "DONE") done += 1;
    else if (status === "PENDING") pending += 1;
  }
  const total = done + pending;
  if (total === 0) return 0;
  return done / total;
}

/** Fecha (Date o ISO string) reducida a su porción de fecha pura "YYYY-MM-DD". */
export function toDateOnlyISO(date: Date | string): string {
  const iso = typeof date === "string" ? date : date.toISOString();
  return iso.slice(0, 10);
}

/**
 * Un hábito creado a mitad de un ciclo no "existía" antes de su `createdAt`.
 * Para días anteriores a esa fecha (comparación solo de fecha, sin hora), la
 * celda se trata como no contable — igual que `NA` — tanto acá como en el
 * cálculo del cliente (apps/web/src/lib/completion.ts).
 */
export function isDateCountableForHabit(
  habitCreatedAt: Date | string,
  dateISO: string,
): boolean {
  return dateISO >= toDateOnlyISO(habitCreatedAt);
}

export type TrackedHabit = { id: string; createdAt: Date | string };
export type TrackedLog = { habitId: string; date: Date | string; status: string };

function buildStatusLookup(logs: TrackedLog[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const log of logs) {
    map.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
  }
  return map;
}

/** Estados efectivos de un hábito a través de los días dados (para el % de fila). */
function statusesForHabit(
  habit: TrackedHabit,
  days: string[],
  lookup: Map<string, string>,
): string[] {
  const statuses: string[] = [];
  for (const day of days) {
    if (!isDateCountableForHabit(habit.createdAt, day)) continue;
    statuses.push(lookup.get(`${habit.id}|${day}`) ?? "PENDING");
  }
  return statuses;
}

/** % de cumplimiento por hábito (fila), a lo largo de los días dados. */
export function calculateCompletionRateByHabit(
  habits: TrackedHabit[],
  days: string[],
  logs: TrackedLog[],
): Record<string, number> {
  const lookup = buildStatusLookup(logs);
  const result: Record<string, number> = {};
  for (const habit of habits) {
    result[habit.id] = calculateCompletionRate(statusesForHabit(habit, days, lookup));
  }
  return result;
}

/** % de cumplimiento por día (columna), a través de todos los hábitos dados. */
export function calculateCompletionRateByDay(
  habits: TrackedHabit[],
  days: string[],
  logs: TrackedLog[],
): Record<string, number> {
  const lookup = buildStatusLookup(logs);
  const result: Record<string, number> = {};
  for (const day of days) {
    const statuses: string[] = [];
    for (const habit of habits) {
      if (!isDateCountableForHabit(habit.createdAt, day)) continue;
      statuses.push(lookup.get(`${habit.id}|${day}`) ?? "PENDING");
    }
    result[day] = calculateCompletionRate(statuses);
  }
  return result;
}

export type CycleForActive = { endDate: Date | string };

/**
 * Ciclo activo: entre los ciclos con `endDate >= hoy`, el de `endDate` más
 * próxima. Si ninguno cumple eso (todos ya terminaron), el de `endDate` más
 * reciente. Única fuente de verdad — el frontend consume el resultado de esto
 * a través del backend en vez de reimplementar el criterio.
 */
export function getActiveCycle<T extends CycleForActive>(
  cycles: T[],
  today: Date = new Date(),
): T | undefined {
  if (cycles.length === 0) return undefined;

  // `today` es el instante actual (no una fecha ya guardada): usa el
  // calendario LOCAL (todayLocalISO), no UTC — ver su comentario en
  // date-utils.ts. `c.endDate` sigue con toDateOnlyISO porque esas SÍ son
  // fechas puras a medianoche UTC guardadas en la base.
  const todayISO = todayLocalISO(today);
  const upcoming = cycles.filter((c) => toDateOnlyISO(c.endDate) >= todayISO);

  const pool = upcoming.length > 0 ? upcoming : cycles;
  const pickClosest = upcoming.length > 0;

  return pool.reduce((best, current) => {
    const bestISO = toDateOnlyISO(best.endDate);
    const currentISO = toDateOnlyISO(current.endDate);
    const currentIsBetter = pickClosest ? currentISO < bestISO : currentISO > bestISO;
    return currentIsBetter ? current : best;
  });
}
