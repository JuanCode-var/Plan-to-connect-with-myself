// "Mi palabra" mensual (pedido explícito: "el peso de la palabra se mide en
// MESES cumplidos, no en días marcados"). Un compromiso se divide en tramos
// de mes calendario desde su `startDate` — el último tramo puede ser más
// corto que un mes (ver ejemplo del pedido: firmado el 8 oct, termina el 18
// dic → mes 1 (8 oct–8 nov), mes 2 (8 nov–8 dic), tramo final de 10 días).
// Esta derivación es la MISMA para compromisos nuevos (duración exacta en
// meses, sin tramo final) y viejos (fecha objetivo arbitraria, con tramo
// final) — no hace falta guardar "duración en meses" en la base, se deriva
// siempre de startDate/targetDate.
const MS_PER_DAY = 86_400_000;

export type MonthSegment = {
  monthIndex: number;
  startDate: Date;
  endDate: Date;
  isPartial: boolean;
};

export type MonthStatus = "futuro" | "en_curso" | "pendiente_cierre" | "sellado" | "sin_sello";

export type MonthResolution = { monthIndex: number; sealed: boolean; fallReportedAt: Date | null };

/** `date` + `months` meses calendario, con el mismo criterio de "clamp" que cualquier calendario real: el 31 de enero + 1 mes es el 28 (o 29) de febrero, nunca el 2/3 de marzo. */
export function addMonthsUTC(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const firstOfTarget = new Date(Date.UTC(year, month + months, 1));
  const daysInTargetMonth = new Date(Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth() + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, daysInTargetMonth);
  return new Date(Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth(), clampedDay));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/** Los tramos de mes calendario de un compromiso, desde `startDate` hasta `targetDate` (inclusive). Nunca vacío: un compromiso de menos de un mes (solo posible en datos viejos — ya no se permite crear uno así) devuelve un único tramo parcial. */
export function deriveMonthSegments(startDate: Date, targetDate: Date): MonthSegment[] {
  const segments: MonthSegment[] = [];
  let cursor = startDate;
  let i = 1;
  while (true) {
    const next = addMonthsUTC(startDate, i);
    if (next.getTime() >= targetDate.getTime()) {
      segments.push({ monthIndex: i, startDate: cursor, endDate: targetDate, isPartial: next.getTime() > targetDate.getTime() });
      break;
    }
    segments.push({ monthIndex: i, startDate: cursor, endDate: next, isPartial: false });
    cursor = next;
    i += 1;
  }
  return segments;
}

/** "3 MESES" · "1 MES" · "2 MESES Y 10 DÍAS" — nunca con salto de línea. */
export function formatDurationLabel(segments: MonthSegment[]): string {
  const last = segments[segments.length - 1];
  const fullMonths = last.isPartial ? segments.length - 1 : segments.length;
  const extraDays = last.isPartial ? daysBetween(last.startDate, last.endDate) : 0;

  if (fullMonths === 0) return `${extraDays} DÍA${extraDays === 1 ? "" : "S"}`;
  const monthsLabel = `${fullMonths} MES${fullMonths === 1 ? "" : "ES"}`;
  if (extraDays === 0) return monthsLabel;
  return `${monthsLabel} Y ${extraDays} DÍA${extraDays === 1 ? "" : "S"}`;
}

/** Estado derivado de un tramo: una fila de resolución (si existe) manda siempre; si no, se deriva de la fecha. El día de cierre mismo YA cuenta como "pendiente de cierre" (el recordatorio de Paso 5 sale ESE día). */
export function computeMonthStatus(segment: MonthSegment, row: MonthResolution | undefined, today: Date): MonthStatus {
  if (row) return row.sealed ? "sellado" : "sin_sello";
  if (today.getTime() < segment.startDate.getTime()) return "futuro";
  if (today.getTime() < segment.endDate.getTime()) return "en_curso";
  return "pendiente_cierre";
}

/** Día actual dentro del tramo (1-based) y cuántos días tiene el tramo en total — para "Día 12 de 30 del mes" y el anillo "12/30". */
export function dayWithinSegment(segment: MonthSegment, today: Date): { day: number; totalDays: number } {
  const totalDays = Math.max(1, daysBetween(segment.startDate, segment.endDate));
  const elapsed = daysBetween(segment.startDate, today);
  return { day: Math.min(Math.max(elapsed + 1, 1), totalDays), totalDays };
}

/** El tramo "actual": el primero cuyo fin todavía no pasó; si el compromiso ya terminó del todo, el último (para los estados "Terminado"/"Cumplido"/"Cerrado con honestidad"). */
export function currentSegment(segments: MonthSegment[], today: Date): MonthSegment {
  for (const seg of segments) {
    if (today.getTime() <= seg.endDate.getTime()) return seg;
  }
  return segments[segments.length - 1];
}

export type FinalState = "pendiente" | "sellado" | "sin_sello" | null;

/** `null` si el compromiso todavía no terminó (hoy <= fin del último tramo). */
export function finalStateFor(segments: MonthSegment[], rows: MonthResolution[], today: Date): FinalState {
  const last = segments[segments.length - 1];
  if (today.getTime() <= last.endDate.getTime()) return null;
  const row = rows.find((r) => r.monthIndex === last.monthIndex);
  if (!row) return "pendiente";
  return row.sealed ? "sellado" : "sin_sello";
}

export function sealedCount(rows: MonthResolution[]): number {
  return rows.filter((r) => r.sealed).length;
}
