import type { JournalEntry } from "../api/journal";
import { EMOTION_COLORS, EMOTION_FALLBACK_COLOR, type Emotion } from "../domain";
import { addDaysISO } from "./date";
import { DIARIO_WEEKDAY_LABELS } from "./journalWeek";

const EMOTION_ARTICLE: Record<Emotion, string> = {
  Alegría: "la",
  Calma: "la",
  Gratitud: "la",
  Orgullo: "el",
  Esperanza: "la",
  Ansiedad: "la",
  Tristeza: "la",
  Frustración: "la",
  Enojo: "el",
  Cansancio: "el",
};

function daysBetween(fromISO: string, toISO: string): number {
  const [y1, m1, d1] = fromISO.split("-").map(Number);
  const [y2, m2, d2] = toISO.split("-").map(Number);
  const from = Date.UTC(y1, m1 - 1, d1);
  const to = Date.UTC(y2, m2 - 1, d2);
  return Math.round((to - from) / 86_400_000);
}

function emotionColor(emotion: string): string {
  return (EMOTION_COLORS as Record<string, string>)[emotion] ?? EMOTION_FALLBACK_COLOR;
}

export type DominantEmotion = { emotion: string; color: string };

/** La emoción "dominante" de un conjunto de registros del mismo día: la de
 * mayor intensidad declarada; sin intensidad (o empate), la más reciente. */
function dominantEmotionOf(entries: JournalEntry[]): DominantEmotion | null {
  if (entries.length === 0) return null;
  const best = entries.reduce((a, b) => {
    const ai = a.intensity ?? -1;
    const bi = b.intensity ?? -1;
    if (bi !== ai) return bi > ai ? b : a;
    return b.createdAt > a.createdAt ? b : a;
  });
  if (!best.emotion) return null;
  return { emotion: best.emotion, color: emotionColor(best.emotion) };
}

/** Un valor por día de `weekDays` (o `null` si ese día no tiene registro) —
 * para los 7 círculos de "Tu semana emocional". */
export function dominantEmotionByDay(entries: JournalEntry[], weekDays: string[]): (DominantEmotion | null)[] {
  return weekDays.map((day) => dominantEmotionOf(entries.filter((e) => e.date.slice(0, 10) === day)));
}

/**
 * "Esta semana predominó la calma. La ansiedad apareció el martes." — nunca
 * inventa una causa (el mockup dice "después del trabajo", pero no hay
 * ningún dato de hora/contexto real para sostener eso). `null` si hay menos
 * de 2 días con registro — no hay suficiente para hablar de un patrón.
 */
export function emotionWeekSummaryText(byDay: (DominantEmotion | null)[]): string | null {
  const present = byDay.filter((d): d is DominantEmotion => d !== null);
  if (present.length < 2) return null;

  const counts = new Map<string, number>();
  for (const d of present) counts.set(d.emotion, (counts.get(d.emotion) ?? 0) + 1);
  const [dominant] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  const dominantLabel = `${EMOTION_ARTICLE[dominant as Emotion] ?? "la"} ${dominant.toLowerCase()}`;
  let text = `Esta semana predominó ${dominantLabel}.`;

  const secondaryIndex = byDay.findIndex((d) => d && d.emotion !== dominant);
  if (secondaryIndex >= 0) {
    const secondary = byDay[secondaryIndex]!.emotion;
    const weekdayLong = ["el lunes", "el martes", "el miércoles", "el jueves", "el viernes", "el sábado", "el domingo"][secondaryIndex];
    text += ` ${EMOTION_ARTICLE[secondary as Emotion] === "el" ? "El" : "La"} ${secondary.toLowerCase()} apareció ${weekdayLong}.`;
  }
  return text;
}

/** Días consecutivos (calendario, sin huecos) con al menos un registro,
 * contando hacia atrás desde hoy si hoy ya tiene uno, o desde ayer si
 * todavía no. */
export function entryDateStreak(entryDates: string[], todayISO: string): number {
  const dates = new Set(entryDates);
  let cursor = dates.has(todayISO) ? todayISO : addDaysISO(todayISO, -1);
  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

export type MemoryEntry = { label: string; entry: JournalEntry };

/** Las entradas más cercanas a "hace N días" para cada offset — un recuerdo
 * por offset, nunca repetido entre offsets. Si no queda ninguna entrada sin
 * usar, ese offset simplemente no aparece (no se rellena con nada). */
export function closestMemoryEntries(entries: JournalEntry[], todayISO: string, offsets: number[] = [7, 14, 21]): MemoryEntry[] {
  const used = new Set<string>();
  const result: MemoryEntry[] = [];
  for (const offset of offsets) {
    const target = addDaysISO(todayISO, -offset);
    const candidates = entries.filter((e) => !used.has(e.id));
    if (candidates.length === 0) continue;
    const closest = candidates.reduce((a, b) =>
      Math.abs(daysBetween(target, b.date.slice(0, 10))) < Math.abs(daysBetween(target, a.date.slice(0, 10))) ? b : a,
    );
    used.add(closest.id);
    result.push({ label: `Hace ${offset} días`, entry: closest });
  }
  return result;
}

/** Actividades de flow más usadas, de más a menos frecuente. */
export function topFlowActivities(entries: JournalEntry[], limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (!e.flowActivity) continue;
    counts.set(e.flowActivity, (counts.get(e.flowActivity) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([activity]) => activity).slice(0, limit);
}

/** Las sesiones de flow más largas de todo el historial. */
export function longestFlowSessions(entries: JournalEntry[], limit = 3): JournalEntry[] {
  return entries
    .filter((e) => e.flowMinutes != null)
    .sort((a, b) => (b.flowMinutes ?? 0) - (a.flowMinutes ?? 0))
    .slice(0, limit);
}

/** Minutos de flow sumados por día de `weekDays`. */
export function flowMinutesByDay(entries: JournalEntry[], weekDays: string[]): number[] {
  return weekDays.map((day) => entries.filter((e) => e.date.slice(0, 10) === day).reduce((sum, e) => sum + (e.flowMinutes ?? 0), 0));
}

export function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function weekdayLabel(index: number): string {
  return DIARIO_WEEKDAY_LABELS[index];
}
