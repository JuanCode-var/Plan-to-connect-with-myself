import type { WordCommitmentMonth, WordCommitmentUnlocked } from "../api/word";

/** `dateISO` ("YYYY-MM-DD") + `months` meses calendario, con el mismo "clamp" que el backend (ver addMonthsUTC en apps/api/src/lib/wordMonths.ts) — el 31 de enero + 1 mes es el 28 (o 29) de febrero, nunca el 2/3 de marzo. Usado solo para la vista previa al elegir duración (Paso 4); lo que se guarda es lo que el backend recibe tal cual. */
export function addMonthsISO(dateISO: string, months: number): string {
  const [year, month, day] = dateISO.slice(0, 10).split("-").map(Number);
  const firstOfTarget = new Date(Date.UTC(year, month - 1 + months, 1));
  const daysInTargetMonth = new Date(Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth() + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, daysInTargetMonth);
  const result = new Date(Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth(), clampedDay));
  return result.toISOString().slice(0, 10);
}

export type MonthClosure = { commitment: WordCommitmentUnlocked; month: WordCommitmentMonth };

/** Todos los tramos "pendiente de cierre" de todos los compromisos, el más antiguo primero (se muestran uno por uno, ver Paso 2). */
export function findPendingClosures(commitments: WordCommitmentUnlocked[]): MonthClosure[] {
  const result: MonthClosure[] = [];
  for (const commitment of commitments) {
    for (const month of commitment.months) {
      if (month.status === "pendiente_cierre") result.push({ commitment, month });
    }
  }
  return result.sort((a, b) => a.month.endDate.localeCompare(b.month.endDate));
}

/** El tramo "en curso" de cada compromiso que tenga uno — su fin es el próximo cierre real. */
export function findUpcomingClosures(commitments: WordCommitmentUnlocked[]): MonthClosure[] {
  const result: MonthClosure[] = [];
  for (const commitment of commitments) {
    const current = commitment.months.find((m) => m.status === "en_curso");
    if (current) result.push({ commitment, month: current });
  }
  return result.sort((a, b) => a.month.endDate.localeCompare(b.month.endDate));
}

/** Días de calendario entre hoy y una fecha futura (ambas "YYYY-MM-DD" o ISO completo) — negativo si ya pasó. */
export function daysUntil(dateISO: string, todayISO: string): number {
  const [y1, m1, d1] = dateISO.slice(0, 10).split("-").map(Number);
  const [y2, m2, d2] = todayISO.slice(0, 10).split("-").map(Number);
  const target = Date.UTC(y1, m1 - 1, d1);
  const today = Date.UTC(y2, m2 - 1, d2);
  return Math.round((target - today) / 86_400_000);
}
