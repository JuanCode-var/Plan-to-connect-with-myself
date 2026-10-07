import type { HabitMoment, LogStatus } from "../domain";
import { addDaysISO } from "./date";

/**
 * % de cumplimiento = DONE / (DONE + PENDING), excluyendo `NA`. Si el
 * denominador es 0, el resultado es 0 (nunca `NaN`). Misma fórmula que
 * apps/api/src/services/tracking.ts::calculateCompletionRate — si cambiás
 * una, cambiá la otra.
 */
export function calculateCompletionRate(statuses: LogStatus[]): number {
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

/** Recorta cualquier string ISO a su porción de fecha pura "YYYY-MM-DD". */
export function toDateOnlyISO(date: string): string {
  return date.slice(0, 10);
}

/**
 * Un hábito creado a mitad de un ciclo no "existía" antes de su `createdAt`.
 * Los días anteriores a esa fecha (comparación solo de fecha, sin hora) se
 * excluyen del cálculo — mismo criterio que
 * apps/api/src/services/tracking.ts::isDateCountableForHabit.
 */
export function isDateCountableForHabit(habitCreatedAt: string, dateISO: string): boolean {
  return dateISO >= toDateOnlyISO(habitCreatedAt);
}

/**
 * Un día se "cierra" (deja de poder marcarse) al día siguiente de esa fecha
 * para el resto de los hábitos, pero para los de NOCHE se da un día extra de
 * margen: recién se cierran dos días después. Motivo: un hábito nocturno (ej.
 * "Reservar ventana de sueño 7-9h") se decide al despertar al día SIGUIENTE,
 * no a medianoche — cerrarlo el mismo día que cierra todo lo demás obligaría
 * a marcarlo antes de saber si de verdad se cumplió.
 */
export function isDateLockedForHabit(habitMoment: HabitMoment, dateISO: string, todayISO: string): boolean {
  const cutoff = habitMoment === "NOCHE" ? addDaysISO(todayISO, -1) : todayISO;
  return dateISO < cutoff;
}

/**
 * Hitos de racha para el refuerzo intermitente (toast de felicitación). No es
 * una afirmación científica sobre cuánto tarda en "formarse" un hábito —eso
 * varía mucho persona a persona y no hay un número mágico—, son checkpoints
 * de ánimo espaciados a propósito: un aviso en cada clic pierde efecto por
 * habituación (refuerzo constante se apaga rápido; el intermitente sostiene
 * la motivación más tiempo).
 */
export const STREAK_MILESTONES = [3, 7,14, 21, 30, 45, 60, 90] as const;

export function isStreakMilestone(streak: number): boolean {
  return (STREAK_MILESTONES as readonly number[]).includes(streak);
}

/**
 * Racha de días consecutivos en `DONE`, contando hacia atrás desde
 * `anchorDate` (inclusive) sobre `dates` (orden cronológico ascendente,
 * "YYYY-MM-DD"). Un día en `NA` no rompe la racha ni la incrementa —mismo
 * criterio que excluye `NA` del % de cumplimiento—; el primer `PENDING` la
 * corta. Si `anchorDate` es posterior al último día de `dates` (p. ej. "hoy"
 * cuando el último día ya registrado fue ayer), ancla en el último día
 * disponible en vez de devolver 0.
 *
 * También sirve para calcular una racha "proyectada" pasando un `statusOf`
 * que ya asume el nuevo estado del clic actual, antes de que vuelva la
 * respuesta del servidor — así el toast de hito se dispara en el mismo
 * evento de clic, sin esperar un refetch.
 */
export function calculateStreak(
  dates: string[],
  anchorDate: string,
  statusOf: (date: string) => LogStatus,
): number {
  let startIndex = -1;
  for (let i = dates.length - 1; i >= 0; i--) {
    if (dates[i] <= anchorDate) {
      startIndex = i;
      break;
    }
  }
  if (startIndex === -1) return 0;

  let streak = 0;
  for (let i = startIndex; i >= 0; i--) {
    const status = statusOf(dates[i]);
    if (status === "DONE") {
      streak += 1;
      continue;
    }
    if (status === "NA") continue;
    break;
  }
  return streak;
}
