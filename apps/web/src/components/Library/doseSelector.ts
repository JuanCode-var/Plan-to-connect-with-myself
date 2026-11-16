import { addDaysISO } from "../../lib/date";
import { BRAIN_AREAS, type BrainArea } from "../NeuralCore/brainTokens";

/**
 * "Alimento para tu cerebro" — selector de la dosis del día (Fase 0, punto
 * 5 del pedido). Función pura: toda la data real (% del ciclo por área,
 * dosis ya vistas, el hábito pendiente de ayer) la junta el caller desde
 * los hooks que ya existen (useCycleResonance, /dose-progress) — acá solo
 * vive la REGLA de selección, para poder probarla sin tocar React ni la API.
 */

export type DoseCandidate = { id: string; area: BrainArea };

export type YesterdayPendingHabit = { id: string; name: string };

export type DoseSelectorInput = {
  /** % del ciclo actual por área (null = sin hábitos en esa área) — mismo shape que ResonanceArea.percent. */
  byAreaPercent: Partial<Record<BrainArea, number | null>>;
  /** Todas las dosis activas (cualquier área). */
  doses: DoseCandidate[];
  /** Ids de dosis que el usuario YA completó alguna vez (cualquier fecha). */
  completedDoseIds: ReadonlySet<string>;
  /** Fecha ISO (string, comparable) de la última vez que se completó cada dosis — solo hace falta para desempatar al RECICLAR (todas las dosis de un área ya vistas). */
  lastCompletedAtByDoseId?: ReadonlyMap<string, string>;
  /** El hábito de prioridad alta que quedó PENDING ayer, por área (si hay más de uno, el caller ya eligió cuál pasar). */
  yesterdayPendingHighPriorityHabitByArea?: Partial<Record<BrainArea, YesterdayPendingHabit>>;
};

export type DailyDoseSelection = {
  doseId: string;
  area: BrainArea;
  /** `true` solo cuando esta dosis nunca se completó (para distinguir de un reciclado, útil para no mostrar el ✓ equivocado). */
  isRecycled: boolean;
  yesterdayHabitForHook: YesterdayPendingHabit | null;
};

/**
 * 1. Elige el ÁREA con menor % del ciclo (null cuenta como 0 — un área sin
 *    ningún hábito todavía es la que más lo necesita) ENTRE LAS QUE TIENEN
 *    al menos una dosis sin ver. 2. Si TODAS las áreas con dosis ya agotaron
 *    las suyas, recicla: misma regla de "menor %", pero eligiendo dentro de
 *    esa área la dosis vista hace más tiempo (o la primera, si no hay
 *    historial de fechas). 3. Sin ninguna dosis cargada todavía, `null`.
 */
export function selectDailyDose(input: DoseSelectorInput): DailyDoseSelection | null {
  const areasWithDoses = BRAIN_AREAS.filter((area) => input.doses.some((d) => d.area === area));
  if (areasWithDoses.length === 0) return null;

  const unseenByArea = new Map<BrainArea, DoseCandidate[]>();
  for (const area of areasWithDoses) {
    unseenByArea.set(
      area,
      input.doses.filter((d) => d.area === area && !input.completedDoseIds.has(d.id)),
    );
  }
  const areasWithUnseen = areasWithDoses.filter((area) => unseenByArea.get(area)!.length > 0);
  const recycling = areasWithUnseen.length === 0;
  const pool = recycling ? areasWithDoses : areasWithUnseen;

  const percentOf = (area: BrainArea) => input.byAreaPercent[area] ?? 0;
  const bestArea = pool.reduce((best, area) => (percentOf(area) < percentOf(best) ? area : best), pool[0]);

  let chosen: DoseCandidate;
  if (recycling) {
    const candidates = input.doses.filter((d) => d.area === bestArea);
    const lastSeen = input.lastCompletedAtByDoseId;
    chosen = [...candidates].sort((a, b) => (lastSeen?.get(a.id) ?? "").localeCompare(lastSeen?.get(b.id) ?? ""))[0];
  } else {
    chosen = unseenByArea.get(bestArea)![0];
  }

  return {
    doseId: chosen.id,
    area: bestArea,
    isRecycled: recycling,
    yesterdayHabitForHook: input.yesterdayPendingHighPriorityHabitByArea?.[bestArea] ?? null,
  };
}

/**
 * Resuelve `{habito}` del `hookTemplate` de una dosis (ver Dose.hookTemplate
 * en schema.prisma) con el hábito real pendiente de ayer — o, sin ese dato,
 * una cláusula genérica honesta (nunca un hábito inventado).
 */
export function resolveHookText(template: string, habit: YesterdayPendingHabit | null): string {
  return template.replace("{habito}", habit ? `cumpliste con «${habit.name}»` : "cumpliste con algo importante");
}

/**
 * Racha de días CONSECUTIVOS con al menos una dosis completada, contando
 * hacia atrás desde hoy — si hoy todavía no se hizo ninguna, arranca desde
 * ayer (no rompe la racha solo porque todavía es temprano). `dates` son
 * fechas YYYY-MM-DD (calendario local), pueden venir repetidas/desordenadas.
 */
/** Índice 0 (lunes) a 6 (domingo) de una fecha YYYY-MM-DD — semana con inicio en lunes, para "RACHA DE DOSIS" (L-D). */
function isoWeekdayIndex(dateISO: string): number {
  const [y, m, d] = dateISO.split("-").map(Number);
  const jsDay = new Date(y, m - 1, d).getDay(); // 0=domingo..6=sábado
  return (jsDay + 6) % 7;
}

export type WeekStreakDay = { date: string; done: boolean; isToday: boolean };

/** Los 7 días (lunes a domingo) de la semana de HOY, con cuáles tienen al menos una dosis completada. */
export function weekStreakDays(dates: string[], todayDateISO: string): WeekStreakDay[] {
  const set = new Set(dates);
  const monday = addDaysISO(todayDateISO, -isoWeekdayIndex(todayDateISO));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDaysISO(monday, i);
    return { date, done: set.has(date), isToday: date === todayDateISO };
  });
}

export function computeDoseStreak(dates: string[], todayDateISO: string): number {
  const set = new Set(dates);
  let streak = 0;
  let cursor = set.has(todayDateISO) ? todayDateISO : addDaysISO(todayDateISO, -1);
  while (set.has(cursor)) {
    streak++;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}
