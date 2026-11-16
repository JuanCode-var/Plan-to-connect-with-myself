import type { HabitMoment, LogStatus } from "../domain";
import { isDateCountableForHabit } from "./completion";
import { calculateCurrentStreak } from "./streak";

export type CompassLinkedHabit = {
  id: string;
  createdAt: string;
  moment: HabitMoment;
  identityId: string | null;
  minimalVersion: string | null;
  identityMessagesEnabled: boolean;
  activeWeekdays?: number[] | null;
};

// Hora local a partir de la cual cada momento del día se considera
// "atrasado" si todavía está PENDING — heurística simple basada en los
// mismos cortes horarios que ya usa lib/greeting.ts (mañana/tarde/noche),
// no un horario configurable por hábito (no existe ese dato hoy).
const OVERDUE_AFTER_HOUR: Record<HabitMoment, number> = {
  MANANA: 12,
  DIA: 18,
  NOCHE: 23,
  CIERRE_DEL_DIA: 23,
};

export function isOverdueToday(
  habit: Pick<CompassLinkedHabit, "moment">,
  status: LogStatus,
  now: Date = new Date(),
): boolean {
  if (status !== "PENDING") return false;
  return now.getHours() >= OVERDUE_AFTER_HOUR[habit.moment];
}

/**
 * Días PENDING consecutivos contando hacia atrás desde AYER (no desde hoy —
 * hoy todavía puede completarse, no "falló" hasta que termine el día). Un
 * DONE o NA corta la racha de fallos, igual que un día no contable (hábito
 * creado después) — mismo criterio que calculateCurrentStreak pero mirando
 * fallos en vez de cumplidos.
 */
export function countConsecutiveFails(
  habit: Pick<CompassLinkedHabit, "id" | "createdAt" | "activeWeekdays">,
  days: string[],
  effectiveStatus: (habitId: string, date: string) => LogStatus,
  todayISO: string,
): number {
  const pastDays = days.filter((d) => d < todayISO);
  let fails = 0;
  for (let i = pastDays.length - 1; i >= 0; i--) {
    const date = pastDays[i];
    if (!isDateCountableForHabit(habit, date)) break;
    if (effectiveStatus(habit.id, date) !== "PENDING") break;
    fails += 1;
  }
  return fails;
}

/**
 * Racha "recién rota": exactamente un día de fallo ayer, justo después de
 * una racha real (2+ días) que venía activa. Si fueran 2+ días de fallo
 * seguidos, ese caso ya lo cubre countConsecutiveFails con su propio
 * mensaje — este trigger es específicamente el golpe de "la corté ayer".
 */
export function isStreakJustBroken(
  habit: Pick<CompassLinkedHabit, "id" | "createdAt">,
  days: string[],
  effectiveStatus: (habitId: string, date: string) => LogStatus,
  todayISO: string,
): boolean {
  const pastDays = days.filter((d) => d < todayISO);
  if (pastDays.length === 0) return false;
  if (countConsecutiveFails(habit, days, effectiveStatus, todayISO) !== 1) return false;

  const failDate = pastDays[pastDays.length - 1];
  const daysBeforeFail = days.filter((d) => d < failDate);
  if (daysBeforeFail.length === 0) return false;
  const streakBeforeFail = calculateCurrentStreak(
    habit,
    daysBeforeFail,
    effectiveStatus,
    daysBeforeFail[daysBeforeFail.length - 1],
  );
  return streakBeforeFail >= 2;
}

// "Máximo un mensaje de identidad por hábito por día" (pedido explícito) —
// throttle efímero en localStorage, no en la base: es un detalle de UI de
// este dispositivo, no un dato que valga la pena sincronizar entre
// dispositivos ni persistir para siempre.
function throttleKey(habitId: string, todayISO: string): string {
  return `compass-msg:${habitId}:${todayISO}`;
}

export function wasMessageShownToday(habitId: string, todayISO: string): boolean {
  try {
    return localStorage.getItem(throttleKey(habitId, todayISO)) === "1";
  } catch {
    return false;
  }
}

export function markMessageShownToday(habitId: string, todayISO: string): void {
  try {
    localStorage.setItem(throttleKey(habitId, todayISO), "1");
  } catch {
    // localStorage puede no estar disponible (modo privado, cuotas) — el
    // throttle es una cortesía, no una garantía; si falla, en el peor caso
    // se repite un mensaje, no se rompe nada.
  }
}
