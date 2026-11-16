const MS_PER_DAY = 86_400_000;

function toUtcMs(dateOnlyISO: string): number {
  const [year, month, day] = dateOnlyISO.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((toUtcMs(toISO) - toUtcMs(fromISO)) / MS_PER_DAY);
}

/** "30 nov" en es-CO, sin punto final de abreviatura ni año. */
export function shortDateParts(dateISO: string): { day: number; month: string } {
  const d = new Date(`${dateISO.slice(0, 10)}T00:00:00`);
  const month = d.toLocaleDateString("es-CO", { month: "short" }).replace(/\.$/, "");
  return { day: d.getDate(), month };
}

export function formatShortDate(dateISO: string): string {
  const { day, month } = shortDateParts(dateISO);
  return `${day} ${month}`;
}

export type CycleDayProgress = { dayNumber: number; daysTotal: number; daysRemaining: number };

/**
 * "Día 13 de 30 · 17 días restantes" (mockup 15) — cuenta inclusiva de
 * ambos extremos del ciclo (1-based): el primer día del ciclo es el día 1,
 * nunca el día 0, y dayNumber + daysRemaining siempre suma daysTotal.
 */
export function cycleDayProgress(startISO: string, endISO: string, todayISO: string): CycleDayProgress {
  const daysTotal = Math.max(1, daysBetween(startISO, endISO) + 1);
  const dayNumber = Math.min(Math.max(daysBetween(startISO, todayISO) + 1, 1), daysTotal);
  return { dayNumber, daysTotal, daysRemaining: daysTotal - dayNumber };
}
