import { todayISO } from "./date";

export type WordProgress = {
  /** 0-100, redondeado. Cuánto del plazo (no del compromiso en sí) ya pasó. */
  percent: number;
  daysElapsed: number;
  daysTotal: number;
  daysRemaining: number;
  state: "upcoming" | "in-progress" | "overdue";
};

function toUtcMs(dateOnlyISO: string): number {
  const [year, month, day] = dateOnlyISO.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

const MS_PER_DAY = 86_400_000;

/**
 * "Progreso" acá es puramente temporal: cuánto del tramo entre `startDate` y
 * `targetDate` ya transcurrió hoy — NO si el compromiso se está cumpliendo o
 * no (eso solo lo sabe la persona). Es la misma idea que una cuenta
 * regresiva con barra de avance, pensada para motivar/recordar en el
 * Resumen, no para medir éxito. `startDate`/`targetDate` llegan de la API
 * como ISO completo (medianoche UTC) — se recorta a la porción de fecha
 * antes de comparar, mismo criterio que toDateOnlyISO en el backend.
 */
export function calculateWordProgress(
  startDateISO: string,
  targetDateISO: string,
  todayDateISO: string = todayISO(),
): WordProgress {
  const startMs = toUtcMs(startDateISO.slice(0, 10));
  const targetMs = toUtcMs(targetDateISO.slice(0, 10));
  const todayMs = toUtcMs(todayDateISO);

  // Mínimo 1 día de "largo" aunque start === target, para nunca dividir por 0.
  const daysTotal = Math.max(1, Math.round((targetMs - startMs) / MS_PER_DAY));
  const daysElapsed = Math.min(Math.max(Math.round((todayMs - startMs) / MS_PER_DAY), 0), daysTotal);
  const daysRemaining = Math.max(Math.round((targetMs - todayMs) / MS_PER_DAY), 0);
  const percent = Math.round((daysElapsed / daysTotal) * 100);

  const state: WordProgress["state"] = todayMs < startMs ? "upcoming" : todayMs > targetMs ? "overdue" : "in-progress";

  return { percent, daysElapsed, daysTotal, daysRemaining, state };
}

/**
 * "Activo" = no vencido todavía (en curso o por empezar) — un compromiso
 * vencido queda clavado en 100% de plazo transcurrido sin decir nada real,
 * así que no cuenta ni para la franja "{N} compromisos activos" del Resumen
 * ni para el % de su área en el Cerebro del ciclo (ver commitmentAreaBlend.ts).
 */
export function isCommitmentActive(commitment: { startDate: string; targetDate: string }): boolean {
  return calculateWordProgress(commitment.startDate, commitment.targetDate).state !== "overdue";
}

/** Mismos 5 hitos que RewireCard.tsx (días sin alcohol/apuestas) — reutilizados acá para que un compromiso de "Mi Palabra" use el mismo lenguaje visual al integrarse en "Circuitos en recableado". */
export const COMMITMENT_MILESTONES = [7, 21, 30, 66, 90] as const;

/** Los hitos que "caen dentro" de la duración total del compromiso (pedido explícito) — un compromiso de 20 días nunca muestra el hito de 30, por ejemplo. */
export function milestonesWithinDuration(daysTotal: number): number[] {
  return COMMITMENT_MILESTONES.filter((m) => m <= daysTotal);
}
