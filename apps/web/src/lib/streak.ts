import type { LogStatus } from "../domain";
import { isDateCountableForHabit } from "./completion";

export type StreakHabit = { id: string; createdAt: string };

/**
 * Racha actual de un hábito: días consecutivos en `DONE`, contando hacia
 * atrás desde el último día ya transcurrido (nunca desde el final de
 * `days`, que en un ciclo activo puede extenderse al futuro y ahí todo está
 * `PENDING` por defecto — eso rompería la racha con datos que todavía ni
 * pasaron). Se corta en el primer día que no sea `DONE`, y también en un
 * día no contable para el hábito (mismo criterio que
 * apps/api/src/services/tracking.ts::isDateCountableForHabit) — un hábito
 * recién creado no puede "heredar" racha de antes de existir.
 */
export function calculateCurrentStreak(
  habit: StreakHabit,
  days: string[],
  effectiveStatus: (habitId: string, date: string) => LogStatus,
  todayISO: string,
): number {
  const elapsedDays = days.filter((d) => d <= todayISO);

  let streak = 0;
  for (let i = elapsedDays.length - 1; i >= 0; i--) {
    const date = elapsedDays[i];
    if (!isDateCountableForHabit(habit.createdAt, date)) break;
    if (effectiveStatus(habit.id, date) !== "DONE") break;
    streak += 1;
  }
  return streak;
}

/**
 * Racha de "días perfectos": días consecutivos (contando hacia atrás desde
 * hoy) en los que TODOS los hábitos contables de ese día quedaron en
 * `DONE`. Un día sin ningún hábito contable no cuenta como perfecto (no hay
 * nada que cumplir) y corta la racha, en vez de saltarlo silenciosamente.
 */
export function calculatePerfectDayStreak(
  habits: StreakHabit[],
  days: string[],
  effectiveStatus: (habitId: string, date: string) => LogStatus,
  todayISO: string,
): number {
  const elapsedDays = days.filter((d) => d <= todayISO);

  let streak = 0;
  for (let i = elapsedDays.length - 1; i >= 0; i--) {
    const date = elapsedDays[i];
    const countableHabits = habits.filter((h) => isDateCountableForHabit(h.createdAt, date));
    if (countableHabits.length === 0) break;
    const allDone = countableHabits.every((h) => effectiveStatus(h.id, date) === "DONE");
    if (!allDone) break;
    streak += 1;
  }
  return streak;
}
