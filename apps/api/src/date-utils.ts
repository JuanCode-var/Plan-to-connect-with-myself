// Utilidades de fecha compartidas por routes/cycles.ts y routes/logs.ts.
// Regla del proyecto: toda fecha de dominio (Cycle.startDate/endDate,
// HabitLog.date) se guarda y compara como fecha pura a medianoche UTC, nunca
// con hora local — ver seed.ts (utcMidnight) para el mismo criterio.

/** Construye una fecha pura a medianoche UTC a partir de un string "YYYY-MM-DD"
 * (o cualquier ISO string que empiece con esa porción de fecha). */
export function parseDateOnlyToUtcMidnight(input: string): Date {
  const datePart = input.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) {
    throw new Error(`Fecha inválida, se esperaba YYYY-MM-DD: "${input}"`);
  }
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0));
}

/** Array de fechas ISO ("YYYY-MM-DD"), una por día, entre start y end (ambos
 * inclusive). Asume que start/end ya son fechas puras a medianoche UTC. */
export function enumerateDaysISO(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(start.getTime());
  while (cursor.getTime() <= end.getTime()) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/**
 * Fecha de HOY en el calendario LOCAL del servidor ("YYYY-MM-DD"), nunca en
 * UTC. Distinto de todo lo de arriba a propósito: esas funciones trabajan
 * sobre fechas YA guardadas como medianoche UTC pura (HabitLog.date,
 * Cycle.startDate/endDate) y deben seguir siendo UTC. Esta, en cambio,
 * convierte el INSTANTE actual — hacerlo con `.toISOString()` (UTC) hace que
 * "hoy" salte al día siguiente en zonas horarias detrás de UTC (ej. Colombia,
 * UTC-5) durante buena parte de la noche local. Usa los getters LOCALES
 * (getFullYear/getMonth/getDate), no los UTC — mismo criterio que
 * apps/web/src/lib/date.ts::todayISO en el frontend.
 */
export function todayLocalISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
