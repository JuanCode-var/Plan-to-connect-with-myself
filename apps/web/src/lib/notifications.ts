import type { LogStatus } from "../domain";
import type { CycleLogs } from "../api/tracking";
import type { Goal } from "../api/goals";
import type { WordCommitment } from "../api/word";
import { isDateCountableForHabit, toDateOnlyISO } from "./completion";
import { calculateCurrentStreak } from "./streak";
import { addDaysISO, todayISO } from "./date";

export type AppNotification = {
  id: string;
  title: string;
  detail: string;
  to: string;
};

// Desde cuántos días de racha vale la pena avisar que está en juego —
// por debajo de esto, perderla no es una pérdida real todavía.
const STREAK_RISK_THRESHOLD = 3;
// Una meta "por vencer" avisa con esta antelación (días); una vez pasada la
// fecha, sigue apareciendo como vencida (no desaparece sola).
const GOAL_DUE_SOON_DAYS = 3;

/**
 * Deriva los avisos de la campanita a partir de datos YA cacheados por
 * React Query en otras partes de la app (mismo criterio que
 * TodayProgress/TrackerMatrix) — nada de tablas ni endpoints nuevos. Cada
 * aviso corresponde a algo real y accionable, nunca a una cifra inventada:
 * racha en riesgo (mismo cálculo que ya usa TrackerMatrix, evaluado hasta
 * AYER para saber qué hay en juego si hoy no se marca), metas por
 * vencer/vencidas y cierres de mes de Mi Palabra.
 */
export function buildNotifications({
  cycleLogs,
  goals,
  wordCommitments,
}: {
  cycleLogs: CycleLogs | undefined;
  goals: Goal[] | undefined;
  wordCommitments?: WordCommitment[];
}): AppNotification[] {
  const notifications: AppNotification[] = [];
  const today = todayISO();

  if (cycleLogs) {
    const lookup = new Map<string, LogStatus>();
    for (const log of cycleLogs.logs) {
      lookup.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
    }
    const effectiveStatus = (habitId: string, date: string): LogStatus =>
      lookup.get(`${habitId}|${date}`) ?? "PENDING";

    const yesterday = addDaysISO(today, -1);
    for (const habit of cycleLogs.habits) {
      if (!isDateCountableForHabit(habit, today)) continue;
      if (effectiveStatus(habit.id, today) === "DONE") continue;
      const streak = calculateCurrentStreak(habit, cycleLogs.days, effectiveStatus, yesterday);
      if (streak >= STREAK_RISK_THRESHOLD) {
        notifications.push({
          id: `streak-${habit.id}`,
          title: `Racha de ${streak} días en riesgo`,
          detail: `Todavía no marcaste "${habit.name}" hoy.`,
          to: "/tracker",
        });
      }
    }
  }

  if (goals) {
    const limit = addDaysISO(today, GOAL_DUE_SOON_DAYS);
    for (const goal of goals) {
      if (goal.achievedAt) continue;
      const targetDate = goal.targetDate.slice(0, 10);
      if (targetDate > limit) continue;
      const overdue = targetDate < today;
      notifications.push({
        id: `goal-${goal.id}`,
        title: overdue ? "Meta vencida" : "Meta por vencer",
        detail: goal.title,
        to: "/metas",
      });
    }
  }

  // "Mi palabra" mensual (Paso 5): un solo aviso el día del cierre, que
  // vuelve a aparecer cada 3 días mientras siga sin responder — nunca a
  // diario (ya no hay marca diaria). `pendingClosure` llega SIN pin (ver
  // GET /word/commitments) y desaparece solo apenas se responde, así que
  // no hace falta un localStorage aparte para dejar de mostrarlo.
  if (wordCommitments) {
    for (const commitment of wordCommitments) {
      if (!commitment.pendingClosure) continue;
      const closureDate = commitment.pendingClosure.endDate.slice(0, 10);
      if (closureDate > today) continue;
      const daysSinceClosure = Math.round(
        (new Date(`${today}T00:00:00Z`).getTime() - new Date(`${closureDate}T00:00:00Z`).getTime()) / 86_400_000,
      );
      if (daysSinceClosure !== 0 && daysSinceClosure % 3 !== 0) continue;
      notifications.push({
        id: `word-closure-${commitment.id}-${commitment.pendingClosure.monthIndex}`,
        title: `Hoy cierras el mes ${commitment.pendingClosure.monthIndex} de ${commitment.title}`,
        detail: "¿Honraste tu palabra?",
        to: "/palabra",
      });
    }
  }

  return notifications;
}
