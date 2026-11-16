import { DAY_STATES, dayStateFor, type ResonanceStateKey } from "./resonanceTokens";

export type EEGDay = { date: string; percent: number };

function toLocalDate(dateOnlyISO: string): Date {
  const [y, m, d] = dateOnlyISO.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 0 = domingo .. 6 = sábado, a partir de la fecha REAL del día (no un offset sintético como el mockup). */
export function dayOfWeek(dateISO: string): number {
  return toLocalDate(dateISO).getDay();
}

export function isWeekend(dateISO: string): boolean {
  const d = dayOfWeek(dateISO);
  return d === 0 || d === 6;
}

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" });

/** "jue 15 oct" — misma fuente (Intl, es-AR) que formatLongDateEs en lib/greeting.ts, forma corta para el tooltip del gráfico. */
export function formatShortDateEs(dateISO: string): string {
  return SHORT_DATE_FORMATTER.format(toLocalDate(dateISO)).replace(".", "");
}

export type ApagonRun = { startIndex: number; endIndex: number; days: number };

/** Rachas consecutivas de días con % < 29 (umbral de "despertar", ver DAY_STATES). */
export function findApagonRuns(days: EEGDay[]): ApagonRun[] {
  const runs: ApagonRun[] = [];
  let start: number | null = null;
  for (let i = 0; i < days.length; i++) {
    const isLow = days[i].percent < 29;
    if (isLow && start === null) start = i;
    if (!isLow && start !== null) {
      runs.push({ startIndex: start, endIndex: i - 1, days: i - start });
      start = null;
    }
  }
  if (start !== null) runs.push({ startIndex: start, endIndex: days.length - 1, days: days.length - start });
  return runs;
}

export type RecoveryAnnotation = { runEndIndex: number; recoveryIndex: number; percent: number };

/**
 * "Volviste con X% al día siguiente" (sección 4 del pedido): SOLO si el día
 * INMEDIATAMENTE siguiente al final de la racha llega a ≥58% — el texto
 * literal dice "al día siguiente", así que si la recuperación real tarda
 * más de un día no se anota acá (sí se sigue contando en el índice de
 * resiliencia, que no tiene esa restricción).
 */
export function findRecoveries(days: EEGDay[]): RecoveryAnnotation[] {
  const runs = findApagonRuns(days);
  const out: RecoveryAnnotation[] = [];
  for (const run of runs) {
    const next = days[run.endIndex + 1];
    if (next && next.percent >= 58) {
      out.push({ runEndIndex: run.endIndex, recoveryIndex: run.endIndex + 1, percent: next.percent });
    }
  }
  return out;
}

/** El MEJOR día en Flow (≥87%) — uno solo, el máximo, no todos los que califican. */
export function bestFlowDayIndex(days: EEGDay[]): number | null {
  let best: number | null = null;
  for (let i = 0; i < days.length; i++) {
    if (days[i].percent >= 87 && (best === null || days[i].percent > days[best].percent)) best = i;
  }
  return best;
}

export type ResilienceResult = { avgDays: number | null; recoveryCount: number; apagonCount: number };

/**
 * Índice de resiliencia (sección 6 del pedido): promedio de días desde que
 * TERMINA un apagón hasta volver a ≥58% — a diferencia de `findRecoveries`
 * (que solo cuenta "al día siguiente"), acá se escanea hacia adelante sin
 * límite, porque esto mide la recuperación real, no una frase con un plazo
 * literal. `avgDays: null` distingue "todavía no hubo ningún apagón" de
 * "0 días en promedio" (que sería un logro raro, no el estado por defecto).
 */
export function computeResilience(pastDays: EEGDay[]): ResilienceResult {
  const runs = findApagonRuns(pastDays);
  const recoveries: number[] = [];
  for (const run of runs) {
    let j = run.endIndex + 1;
    while (j < pastDays.length && pastDays[j].percent < 58) j++;
    if (j < pastDays.length) recoveries.push(j - run.endIndex);
  }
  return {
    avgDays: recoveries.length > 0 ? Math.round(recoveries.reduce((a, b) => a + b, 0) / recoveries.length) : null,
    recoveryCount: recoveries.length,
    apagonCount: runs.length,
  };
}

export type StateCount = { key: ResonanceStateKey; label: string; color: string; count: number };

/** Días de `pastDays` (sin contar hoy) agrupados por estado — orden de mayor a menor (Flow primero), igual criterio que el mockup. */
export function timeInState(pastDays: EEGDay[]): StateCount[] {
  const counts: Record<string, number> = Object.fromEntries(DAY_STATES.map((s) => [s.key, 0]));
  for (const d of pastDays) counts[dayStateFor(d.percent).key] += 1;
  return [...DAY_STATES].reverse().map((s) => ({ key: s.key, label: s.label, color: s.color, count: counts[s.key] }));
}

export type PatternResult = {
  hasWeekday: boolean;
  hasWeekend: boolean;
  weekdayAvg: number;
  weekendAvg: number;
  diff: number;
  /** Mismos promedios, excluyendo días de apagón (%<29) — para el chequeo explícito que pide el punto 6. */
  weekdayAvgNoApagon: number | null;
  weekendAvgNoApagon: number | null;
  diffNoApagon: number | null;
  /** true si `diffNoApagon` cae a la mitad o menos de `diff` — la diferencia real viene sobre todo del apagón. */
  apagonExplainsHalfOrMore: boolean;
};

function average(values: number[]): number {
  return values.length === 0 ? 0 : Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Promedio entre semana vs. fin de semana (sección 6 del pedido), con y sin días de apagón. */
export function computePattern(pastDays: EEGDay[], weekendDates: (dateISO: string) => boolean = isWeekend): PatternResult {
  const weekday = pastDays.filter((d) => !weekendDates(d.date));
  const weekend = pastDays.filter((d) => weekendDates(d.date));
  const weekdayAvg = average(weekday.map((d) => d.percent));
  const weekendAvg = average(weekend.map((d) => d.percent));
  const diff = weekdayAvg - weekendAvg;

  const weekdayNoApagon = weekday.filter((d) => d.percent >= 29);
  const weekendNoApagon = weekend.filter((d) => d.percent >= 29);
  const hasApagonInEither = weekdayNoApagon.length < weekday.length || weekendNoApagon.length < weekend.length;

  let weekdayAvgNoApagon: number | null = null;
  let weekendAvgNoApagon: number | null = null;
  let diffNoApagon: number | null = null;
  let apagonExplainsHalfOrMore = false;
  if (hasApagonInEither && weekdayNoApagon.length > 0 && weekendNoApagon.length > 0) {
    weekdayAvgNoApagon = average(weekdayNoApagon.map((d) => d.percent));
    weekendAvgNoApagon = average(weekendNoApagon.map((d) => d.percent));
    diffNoApagon = weekdayAvgNoApagon - weekendAvgNoApagon;
    apagonExplainsHalfOrMore = Math.abs(diffNoApagon) <= Math.abs(diff) / 2;
  }

  return {
    hasWeekday: weekday.length > 0,
    hasWeekend: weekend.length > 0,
    weekdayAvg,
    weekendAvg,
    diff,
    weekdayAvgNoApagon,
    weekendAvgNoApagon,
    diffNoApagon,
    apagonExplainsHalfOrMore,
  };
}

export function patternText(pattern: PatternResult): string {
  if (!pattern.hasWeekday || !pattern.hasWeekend) {
    return "Todavía no hay suficientes días entre semana y de fin de semana este ciclo para comparar.";
  }
  const abs = Math.abs(pattern.diff);
  if (abs === 0) return "Entre semana y fin de semana vas prácticamente igual este ciclo.";
  const higher = pattern.diff > 0 ? "entre semana" : "los fines de semana";
  let text = `Rindes ${abs} puntos más ${higher} que en el otro grupo de días.`;
  if (pattern.apagonExplainsHalfOrMore && pattern.diffNoApagon !== null) {
    text += ` Gran parte de esa diferencia viene de tus días de apagón — sin ellos, la brecha baja a ${Math.abs(pattern.diffNoApagon)} puntos.`;
  }
  return text;
}

/** "Experimento de la semana" (sección 6) — generado con los conteos reales, sin copiar el reto fijo del mockup. */
export function weeklyExperimentText(states: StateCount[], pattern: PatternResult): string {
  const enfoqueOrMore = states.filter((s) => s.key === "enfoque" || s.key === "flow").reduce((sum, s) => sum + s.count, 0);
  const flow = states.find((s) => s.key === "flow")?.count ?? 0;
  const total = states.reduce((sum, s) => sum + s.count, 0);

  const base = `${enfoqueOrMore} de ${total} días estuviste en Enfoque o más, pero solo ${flow} ${flow === 1 ? "llegó" : "llegaron"} a Flow.`;

  if (pattern.hasWeekday && pattern.hasWeekend && pattern.diff !== 0) {
    const weaker = pattern.diff > 0 ? "los fines de semana" : "entre semana";
    return `${base} Reto: deja listo con anticipación lo que necesites para sostener ${weaker}, y busca tu próximo día en Flow ahí.`;
  }
  if (flow === 0 && enfoqueOrMore > 0) {
    return `${base} Reto: ya tienes la base en Enfoque — elige un solo día esta semana para empujar un poco más y llegar a Flow.`;
  }
  return `${base} Reto: sostén lo que ya funciona y suma un día más en Enfoque o Flow esta semana.`;
}
