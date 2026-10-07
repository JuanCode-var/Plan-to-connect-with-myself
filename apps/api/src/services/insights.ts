// Fase 1 del "agente de insights": sin IA, solo estadística simple sobre los
// datos que ya existen (HabitLog + EmotionalEntry). La fase 2 (redacción con
// un modelo de lenguaje) consume el `summary` ya calculado acá como insumo,
// no reemplaza este cálculo — los números siempre salen de código, nunca de
// un LLM.
import { enumerateDaysISO, parseDateOnlyToUtcMidnight, todayLocalISO } from "../date-utils";
import {
  calculateCompletionRate,
  calculateCompletionRateByDay,
  isDateCountableForHabit,
  toDateOnlyISO,
} from "./tracking";

// Umbrales mínimos para no mostrar "patrones" que en realidad son ruido
// estadístico sobre pocos datos. Son heurísticas simples (no un test
// estadístico formal) a propósito: esto es una app de una sola persona, no
// hace falta más rigor que "¿esto es demasiada coincidencia para ignorarlo?".
// MIN_TOTAL_DAYS en 15 (mejor práctica: cubre más de 2 semanas, suficiente
// para que cada día de la semana aparezca al menos 2 veces) — se bajó a 8
// unos días en 2026-10 solo para probar el panel con datos reales tempranos,
// ya revertido. Este valor SIEMPRE debe viajar junto con `minDays` en
// InsightsResult (ver computeInsights más abajo): el frontend lo lee de ahí
// en vez de hardcodear el número, así nunca se desincronizan.
const MIN_TOTAL_DAYS = 15;
const MIN_WEEKDAY_OCCURRENCES = 3;
const WEEKDAY_GAP_THRESHOLD = 0.25;
const MIN_EMOTION_OCCURRENCES = 3;
const EMOTION_GAP_THRESHOLD = 0.2;
const MIN_PAIR_CO_FAILURES = 3;
const PAIR_RATIO_THRESHOLD = 1.5;

const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export type InsightHabit = { id: string; name: string; createdAt: Date | string };
export type InsightLog = { habitId: string; date: Date | string; status: string };
export type InsightEmotionalEntry = { date: Date | string; emotion: string | null };

export type Insight =
  | {
      type: "weekday";
      habitId: string;
      habitName: string;
      weekdayLabel: string;
      rateOnWeekday: number;
      rateOverall: number;
      occurrences: number;
      summary: string;
    }
  | {
      type: "emotion";
      emotion: string;
      rateOnEmotionDays: number;
      rateOtherDays: number;
      occurrences: number;
      summary: string;
    }
  | {
      type: "habit_pair";
      habitAId: string;
      habitAName: string;
      habitBId: string;
      habitBName: string;
      coFailures: number;
      summary: string;
    };

export type InsightsResult = {
  enoughData: boolean;
  totalDays: number;
  minDays: number;
  insights: Insight[];
};

function weekdayOf(dateISO: string): number {
  return new Date(`${dateISO}T00:00:00Z`).getUTCDay();
}

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Rango de días a analizar: desde el dato más antiguo (creación de hábito,
 * log o entrada emocional) hasta hoy. Sin esto no hay forma de saber qué
 * días "existían" para calcular cumplimiento día a día (mismo criterio que
 * enumerateDaysISO usa para un ciclo, acá aplicado a toda la historia).
 */
function buildDateRange(
  habits: InsightHabit[],
  logs: InsightLog[],
  entries: InsightEmotionalEntry[],
): string[] {
  const allDates = [
    ...habits.map((h) => toDateOnlyISO(h.createdAt)),
    ...logs.map((l) => toDateOnlyISO(l.date)),
    ...entries.map((e) => toDateOnlyISO(e.date)),
  ];
  if (allDates.length === 0) return [];
  const earliest = allDates.reduce((min, d) => (d < min ? d : min));
  const today = todayLocalISO();
  if (earliest > today) return [today];
  return enumerateDaysISO(parseDateOnlyToUtcMidnight(earliest), parseDateOnlyToUtcMidnight(today));
}

/** Por hábito, el día de la semana con peor cumplimiento frente a su propio
 * promedio general — ej. "los lunes te cuesta más que el resto de la semana". */
function detectWeekdayPatterns(habits: InsightHabit[], days: string[], logs: InsightLog[]): Insight[] {
  const lookup = new Map<string, string>();
  for (const log of logs) lookup.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);

  const insights: Insight[] = [];
  for (const habit of habits) {
    const countableDays = days.filter((d) => isDateCountableForHabit(habit.createdAt, d));
    if (countableDays.length === 0) continue;

    const statusOf = (d: string) => lookup.get(`${habit.id}|${d}`) ?? "PENDING";
    const overallRate = calculateCompletionRate(countableDays.map(statusOf));

    const byWeekday = new Map<number, string[]>();
    for (const d of countableDays) {
      const wd = weekdayOf(d);
      const arr = byWeekday.get(wd) ?? [];
      arr.push(statusOf(d));
      byWeekday.set(wd, arr);
    }

    let worst: { weekday: number; rate: number; occurrences: number } | null = null;
    for (const [weekday, statuses] of byWeekday) {
      const occurrences = statuses.filter((s) => s !== "NA").length;
      if (occurrences < MIN_WEEKDAY_OCCURRENCES) continue;
      const rate = calculateCompletionRate(statuses);
      if (!worst || rate < worst.rate) worst = { weekday, rate, occurrences };
    }

    if (worst && overallRate - worst.rate >= WEEKDAY_GAP_THRESHOLD) {
      const weekdayLabel = WEEKDAY_LABELS[worst.weekday];
      insights.push({
        type: "weekday",
        habitId: habit.id,
        habitName: habit.name,
        weekdayLabel,
        rateOnWeekday: worst.rate,
        rateOverall: overallRate,
        occurrences: worst.occurrences,
        summary: `${habit.name}: los ${weekdayLabel} se cumple ${formatPercent(worst.rate)} de las veces, contra ${formatPercent(overallRate)} en el resto de la semana.`,
      });
    }
  }
  return insights;
}

/** Emociones del diario cuyo día asociado tiene, en promedio, un cumplimiento
 * general notablemente más bajo que el resto de los días. */
function detectEmotionPatterns(
  habits: InsightHabit[],
  days: string[],
  logs: InsightLog[],
  entries: InsightEmotionalEntry[],
): Insight[] {
  const dayRates = calculateCompletionRateByDay(habits, days, logs);

  const datesByEmotion = new Map<string, Set<string>>();
  for (const entry of entries) {
    if (!entry.emotion) continue;
    const d = toDateOnlyISO(entry.date);
    const set = datesByEmotion.get(entry.emotion) ?? new Set<string>();
    set.add(d);
    datesByEmotion.set(entry.emotion, set);
  }

  const insights: Insight[] = [];
  for (const [emotion, dateSet] of datesByEmotion) {
    const emotionDays = days.filter((d) => dateSet.has(d));
    if (emotionDays.length < MIN_EMOTION_OCCURRENCES) continue;

    const otherDays = days.filter((d) => !dateSet.has(d));
    if (otherDays.length === 0) continue;

    const rateOnEmotionDays = average(emotionDays.map((d) => dayRates[d] ?? 0));
    const rateOtherDays = average(otherDays.map((d) => dayRates[d] ?? 0));

    if (rateOtherDays - rateOnEmotionDays >= EMOTION_GAP_THRESHOLD) {
      insights.push({
        type: "emotion",
        emotion,
        rateOnEmotionDays,
        rateOtherDays,
        occurrences: emotionDays.length,
        summary: `Los días que registrás "${emotion}" en el diario, tu cumplimiento general baja a ${formatPercent(rateOnEmotionDays)} (vs. ${formatPercent(rateOtherDays)} el resto de los días).`,
      });
    }
  }
  return insights;
}

/** Pares de hábitos que quedan PENDING el mismo día con más frecuencia de la
 * esperable si fallaran de forma independiente uno del otro. */
function detectHabitPairPatterns(habits: InsightHabit[], days: string[], logs: InsightLog[]): Insight[] {
  const lookup = new Map<string, string>();
  for (const log of logs) lookup.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
  const statusOf = (habitId: string, d: string) => lookup.get(`${habitId}|${d}`) ?? "PENDING";

  const insights: Insight[] = [];
  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const a = habits[i];
      const b = habits[j];
      const sharedDays = days.filter(
        (d) => isDateCountableForHabit(a.createdAt, d) && isDateCountableForHabit(b.createdAt, d),
      );
      if (sharedDays.length < MIN_PAIR_CO_FAILURES) continue;

      let aFail = 0;
      let bFail = 0;
      let bothFail = 0;
      for (const d of sharedDays) {
        const aPending = statusOf(a.id, d) === "PENDING";
        const bPending = statusOf(b.id, d) === "PENDING";
        if (aPending) aFail += 1;
        if (bPending) bFail += 1;
        if (aPending && bPending) bothFail += 1;
      }
      if (bothFail < MIN_PAIR_CO_FAILURES) continue;

      const n = sharedDays.length;
      const expectedIfIndependent = (aFail / n) * (bFail / n) * n;
      if (expectedIfIndependent === 0) continue;
      if (bothFail / expectedIfIndependent < PAIR_RATIO_THRESHOLD) continue;

      insights.push({
        type: "habit_pair",
        habitAId: a.id,
        habitAName: a.name,
        habitBId: b.id,
        habitBName: b.name,
        coFailures: bothFail,
        summary: `"${a.name}" y "${b.name}" quedan pendientes juntos ${bothFail} de ${n} días compartidos — más seguido de lo esperable si fallaran por separado.`,
      });
    }
  }
  return insights;
}

export function computeInsights(
  habits: InsightHabit[],
  logs: InsightLog[],
  entries: InsightEmotionalEntry[],
): InsightsResult {
  const days = buildDateRange(habits, logs, entries);
  if (days.length < MIN_TOTAL_DAYS) {
    return { enoughData: false, totalDays: days.length, minDays: MIN_TOTAL_DAYS, insights: [] };
  }

  const insights = [
    ...detectWeekdayPatterns(habits, days, logs),
    ...detectEmotionPatterns(habits, days, logs, entries),
    ...detectHabitPairPatterns(habits, days, logs),
  ];

  return { enoughData: true, totalDays: days.length, minDays: MIN_TOTAL_DAYS, insights };
}
