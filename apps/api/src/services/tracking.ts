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

/** CSV "0,1,5" (0=domingo..6=sábado, igual a Date#getUTCDay()) → [0,1,5].
 * `null`/vacío = todos los días (sin restricción). Mismo criterio que el
 * parser equivalente del cliente (apps/web/src/lib/completion.ts). */
export function parseActiveWeekdays(value: string | null | undefined): number[] | null {
  if (!value) return null;
  const days = value
    .split(",")
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  return days.length > 0 ? days : null;
}

function weekdayOfISO(dateISO: string): number {
  return new Date(`${dateISO}T00:00:00Z`).getUTCDay();
}

export type HabitSchedule = { createdAt: Date | string; activeWeekdays?: string | null };

/**
 * Un hábito creado a mitad de un ciclo no "existía" antes de su `createdAt`.
 * Para días anteriores a esa fecha (comparación solo de fecha, sin hora), la
 * celda se trata como no contable — igual que `NA` — tanto acá como en el
 * cálculo del cliente (apps/web/src/lib/completion.ts). Lo mismo aplica a un
 * día de la semana que no está entre los `activeWeekdays` del hábito (ej. un
 * hábito de "lunes/miércoles/viernes" no cuenta los demás días) — así un
 * hábito de 3 días por semana no necesita que se lo marque "no aplica" a
 * mano el resto de los días.
 */
export function isDateCountableForHabit(habit: HabitSchedule, dateISO: string): boolean {
  if (dateISO < toDateOnlyISO(habit.createdAt)) return false;
  const activeWeekdays = parseActiveWeekdays(habit.activeWeekdays);
  if (activeWeekdays && !activeWeekdays.includes(weekdayOfISO(dateISO))) return false;
  return true;
}

export type TrackedHabit = { id: string; createdAt: Date | string; activeWeekdays?: string | null };
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
    if (!isDateCountableForHabit(habit, day)) continue;
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
      if (!isDateCountableForHabit(habit, day)) continue;
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

// Etapa de mielinización POR HÁBITO (Catálogo de hábitos, mockups 16/16b) —
// distinta de MyelinStage (apps/web/.../brainTokens.ts, que mide
// impulsosDeVida acumulados POR ÁREA) y de HabitStrengthKey (CycleResonance/
// resonanceTokens.ts, % de cumplimiento DENTRO de un ciclo puntual). Acá el
// % es sobre una ventana móvil de calendario (últimos 30 días, o desde que
// se creó si es más joven — ver isDateCountableForHabit, que ya resuelve
// ambos casos con el mismo criterio) — pedido explícito del usuario, no una
// reutilización de los otros dos sistemas.
export type CatalogStage = "nuevo" | "poda" | "chispa" | "sendero" | "consolidado" | "automatico";

const NEW_HABIT_MAX_DAYS = 7;
const AUTOMATICO_MIN_LIFETIME_DONE = 66;

/**
 * `daysSinceCreated` cuenta el día de creación como día 1 (creado hoy = 1).
 * `lifetimeDone` es el total histórico de HabitLog en estado DONE (no solo
 * los últimos 30 días) — umbral exigido además del 100% para "Automático":
 * un hábito nuevo que acierta sus primeros días ya llega a 100% sin haber
 * construido la repetición real que el nombre promete, así que se queda en
 * "Consolidado" hasta sumar los 66 días.
 */
export function catalogStageFor(percent: number, daysSinceCreated: number, lifetimeDone: number): CatalogStage {
  if (daysSinceCreated < NEW_HABIT_MAX_DAYS) return "nuevo";
  if (percent >= 1 && lifetimeDone >= AUTOMATICO_MIN_LIFETIME_DONE) return "automatico";
  if (percent >= 0.85) return "consolidado";
  if (percent >= 0.6) return "sendero";
  if (percent >= 0.3) return "chispa";
  return "poda";
}
