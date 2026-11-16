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
const MIN_TOTAL_DAYS = 15;
const MIN_WEEKDAY_OCCURRENCES = 3;
const WEEKDAY_GAP_THRESHOLD = 0.25;
const MIN_EMOTION_OCCURRENCES = 3;
const EMOTION_GAP_THRESHOLD = 0.2;
const MIN_PAIR_CO_FAILURES = 3;
const PAIR_RATIO_THRESHOLD = 1.5;
// Para el heatmap de la tarjeta de cadena: no tiene sentido mostrar meses de
// historia en una grilla de un vistazo — se recorta a lo reciente, mientras
// que la fracción del encabezado (coFailureDays/sharedDays) sigue usando el
// conteo completo, sin recortar.
const CHAIN_HEATMAP_MAX_DAYS = 30;

const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const WEEKDAY_LABELS_SHORT = ["D", "L", "M", "X", "J", "V", "S"];

export type InsightHabit = { id: string; name: string; createdAt: Date | string; activeWeekdays?: string | null };
export type InsightLog = { habitId: string; date: Date | string; status: string };
export type InsightEmotionalEntry = { date: Date | string; emotion: string | null };

export type WeekdayRate = { weekday: number; label: string; labelShort: string; rate: number; occurrences: number };

export type Insight =
  | {
      type: "weekday";
      habitId: string;
      habitName: string;
      weekdayLabel: string;
      rateOnWeekday: number;
      rateOverall: number;
      occurrences: number;
      byWeekday: WeekdayRate[];
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
      type: "chain";
      habitIds: string[];
      habitNames: string[];
      sharedDays: number;
      coFailureDays: number;
      // Solo tiene sentido con 3+ hábitos — con un par no hay "ancla", son
      // los dos igual de responsables.
      anchor: { habitId: string; habitName: string; rate: number } | null;
      dailyPattern: { date: string; allFailed: boolean }[];
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
 * promedio general — ej. "los lunes te cuesta más que el resto de la semana".
 * `byWeekday` trae las 7 (no solo la peor) para el gráfico de barras del
 * frontend. */
function detectWeekdayPatterns(habits: InsightHabit[], days: string[], logs: InsightLog[]): Insight[] {
  const lookup = new Map<string, string>();
  for (const log of logs) lookup.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);

  const insights: Insight[] = [];
  for (const habit of habits) {
    const countableDays = days.filter((d) => isDateCountableForHabit(habit, d));
    if (countableDays.length === 0) continue;

    const statusOf = (d: string) => lookup.get(`${habit.id}|${d}`) ?? "PENDING";
    const overallRate = calculateCompletionRate(countableDays.map(statusOf));

    const byWeekdayStatuses = new Map<number, string[]>();
    for (const d of countableDays) {
      const wd = weekdayOf(d);
      const arr = byWeekdayStatuses.get(wd) ?? [];
      arr.push(statusOf(d));
      byWeekdayStatuses.set(wd, arr);
    }

    const byWeekday: WeekdayRate[] = [];
    let worst: { weekday: number; rate: number; occurrences: number } | null = null;
    for (let wd = 0; wd < 7; wd++) {
      const statuses = byWeekdayStatuses.get(wd) ?? [];
      const occurrences = statuses.filter((s) => s !== "NA").length;
      const rate = calculateCompletionRate(statuses);
      byWeekday.push({ weekday: wd, label: WEEKDAY_LABELS[wd], labelShort: WEEKDAY_LABELS_SHORT[wd], rate, occurrences });
      if (occurrences < MIN_WEEKDAY_OCCURRENCES) continue;
      if (!worst || rate < worst.rate) worst = { weekday: wd, rate, occurrences };
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
        byWeekday,
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

type PairEdge = { a: InsightHabit; b: InsightHabit; sharedDays: string[]; bothFail: number; failDates: string[] };

/** Todos los pares de hábitos que quedan PENDING el mismo día con más
 * frecuencia de la esperable si fallaran de forma independiente — mismo
 * criterio/umbrales que la vieja detectHabitPairPatterns, ahora como paso
 * intermedio para armar cadenas (ver detectChainPatterns). */
function findPassingPairs(habits: InsightHabit[], days: string[], logs: InsightLog[]): PairEdge[] {
  const lookup = new Map<string, string>();
  for (const log of logs) lookup.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
  const statusOf = (habitId: string, d: string) => lookup.get(`${habitId}|${d}`) ?? "PENDING";

  const edges: PairEdge[] = [];
  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const a = habits[i];
      const b = habits[j];
      const sharedDays = days.filter(
        (d) => isDateCountableForHabit(a, d) && isDateCountableForHabit(b, d),
      );
      if (sharedDays.length < MIN_PAIR_CO_FAILURES) continue;

      let aFail = 0;
      let bFail = 0;
      const failDates: string[] = [];
      for (const d of sharedDays) {
        const aPending = statusOf(a.id, d) === "PENDING";
        const bPending = statusOf(b.id, d) === "PENDING";
        if (aPending) aFail += 1;
        if (bPending) bFail += 1;
        if (aPending && bPending) failDates.push(d);
      }
      const bothFail = failDates.length;
      if (bothFail < MIN_PAIR_CO_FAILURES) continue;

      const n = sharedDays.length;
      const expectedIfIndependent = (aFail / n) * (bFail / n) * n;
      if (expectedIfIndependent === 0) continue;
      if (bothFail / expectedIfIndependent < PAIR_RATIO_THRESHOLD) continue;

      edges.push({ a, b, sharedDays, bothFail, failDates });
    }
  }
  return edges;
}

function buildChainInsight(
  members: InsightHabit[],
  sharedDays: string[],
  coFailureDays: number,
  failDates: string[],
  logs: InsightLog[],
): Insight {
  const lookup = new Map<string, string>();
  for (const log of logs) lookup.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
  const statusOf = (habitId: string, d: string) => lookup.get(`${habitId}|${d}`) ?? "PENDING";

  let anchor: { habitId: string; habitName: string; rate: number } | null = null;
  if (members.length >= 3) {
    for (const m of members) {
      const pendingCount = sharedDays.filter((d) => statusOf(m.id, d) === "PENDING").length;
      const rate = pendingCount / sharedDays.length;
      if (!anchor || rate > anchor.rate) anchor = { habitId: m.id, habitName: m.name, rate };
    }
  }

  const heatmapDays = sharedDays.slice(-CHAIN_HEATMAP_MAX_DAYS);
  const failSet = new Set(failDates);
  const dailyPattern = heatmapDays.map((d) => ({ date: d, allFailed: failSet.has(d) }));

  const names = members.map((m) => m.name);
  const summary =
    members.length === 2
      ? `"${names[0]}" y "${names[1]}" quedan pendientes juntos ${coFailureDays} de ${sharedDays.length} días compartidos — más seguido de lo esperable si fallaran por separado.`
      : `Estos ${members.length} hábitos se caen juntos: ${names.join(", ")} quedaron pendientes el mismo día ${coFailureDays} de ${sharedDays.length} veces.`;

  return {
    type: "chain",
    habitIds: members.map((m) => m.id),
    habitNames: names,
    sharedDays: sharedDays.length,
    coFailureDays,
    anchor,
    dailyPattern,
    summary,
  };
}

/** Días + fechas de falla compartidas por TODO un grupo de hábitos (no solo
 * un par) — usado tanto para decidir si un grupo candidato sigue calificando
 * al agregarle un miembro más, como para construir el insight final. */
function sharedFailuresOf(members: InsightHabit[], days: string[], statusOf: (habitId: string, d: string) => string) {
  const sharedDays = days.filter((d) => members.every((m) => isDateCountableForHabit(m, d)));
  const failDates = sharedDays.filter((d) => members.every((m) => statusOf(m.id, d) === "PENDING"));
  return { sharedDays, failDates };
}

/** Cadenas por "crecimiento de grupo denso" en vez de componentes conexas
 * completas: con datos reales, casi todos los hábitos terminan transitivamente
 * conectados en un solo blob gigante (A-B, B-C, C-D...) que casi nunca falla
 * TODO a la vez — exigir eso sobre la componente entera descartaba cadenas
 * genuinas de 3-4 hábitos que sí caen juntos seguido. En cambio: se arranca
 * del par más fuerte y se le van sumando, de uno en uno, solo los hábitos que
 * tienen arista con TODOS los miembros actuales Y mantienen el grupo por
 * encima del umbral de co-fallas — un grupo denso real, no cualquier camino
 * en el grafo. Lo que no llega a agruparse en 3+ queda como par suelto. */
function detectChainPatterns(habits: InsightHabit[], days: string[], logs: InsightLog[]): Insight[] {
  const edges = findPassingPairs(habits, days, logs);
  if (edges.length === 0) return [];

  const lookup = new Map<string, string>();
  for (const log of logs) lookup.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
  const statusOf = (habitId: string, d: string) => lookup.get(`${habitId}|${d}`) ?? "PENDING";

  const hasEdge = new Set(edges.map((e) => `${e.a.id}|${e.b.id}`));
  const edgeConnects = (id1: string, id2: string) => hasEdge.has(`${id1}|${id2}`) || hasEdge.has(`${id2}|${id1}`);

  const assigned = new Set<string>();
  const insights: Insight[] = [];
  const sortedEdges = [...edges].sort((a, b) => b.bothFail - a.bothFail);

  for (const seed of sortedEdges) {
    if (assigned.has(seed.a.id) || assigned.has(seed.b.id)) continue;

    let group = [seed.a, seed.b];
    let best = sharedFailuresOf(group, days, statusOf);
    let candidates = habits.filter((h) => !group.some((g) => g.id === h.id) && !assigned.has(h.id));

    let grew = true;
    while (grew) {
      grew = false;
      for (const cand of candidates) {
        if (!group.every((m) => edgeConnects(m.id, cand.id))) continue;
        const testGroup = [...group, cand];
        const testResult = sharedFailuresOf(testGroup, days, statusOf);
        if (testResult.failDates.length >= MIN_PAIR_CO_FAILURES) {
          group = testGroup;
          best = testResult;
          candidates = candidates.filter((c) => c.id !== cand.id);
          grew = true;
          break;
        }
      }
    }

    if (group.length >= 3) {
      for (const m of group) assigned.add(m.id);
      insights.push(buildChainInsight(group, best.sharedDays, best.failDates.length, best.failDates, logs));
    }
  }

  // Lo que no quedó absorbido por una cadena de 3+ se reporta como su par
  // original — cada arista se recorre una sola vez acá, sin duplicados.
  for (const edge of edges) {
    if (assigned.has(edge.a.id) || assigned.has(edge.b.id)) continue;
    insights.push(buildChainInsight([edge.a, edge.b], edge.sharedDays, edge.bothFail, edge.failDates, logs));
  }

  return insights;
}

/** Puntaje heurístico de "qué tan fuerte/llamativo" es un patrón, para poder
 * ordenar y elegir cuál va destacado — no es estadística formal, mismo
 * criterio que el resto de este archivo. */
function scoreInsight(insight: Insight): number {
  if (insight.type === "chain") return insight.habitIds.length * insight.coFailureDays * 10;
  if (insight.type === "weekday") return Math.round((insight.rateOverall - insight.rateOnWeekday) * 100);
  return Math.round((insight.rateOtherDays - insight.rateOnEmotionDays) * 100);
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
    ...detectChainPatterns(habits, days, logs),
  ].sort((a, b) => scoreInsight(b) - scoreInsight(a));

  return { enoughData: true, totalDays: days.length, minDays: MIN_TOTAL_DAYS, insights };
}
