import { isDateCountableForHabit, type HabitSchedule } from "../../lib/completion";
import type { LogStatus } from "../../domain";
import type { BrainArea } from "../NeuralCore/brainTokens";
import type { HabitStrengthKey } from "./resonanceTokens";

/**
 * "Sinergias" — toda la aritmética (elegibilidad, con/sin, Jaccard, anclas,
 * efecto dominó) vive acá, separada del render, para poder probarla sin
 * tocar React ni canvas. En el mockup los números son de ejemplo (`NODES`/
 * `LINKS` hardcodeados) — acá se calculan del historial real del ciclo
 * (`resonance.habitLogs`), nunca copiados del archivo.
 */

export const MIN_CYCLE_DAYS_FOR_SYNERGIES = 14;
const MIN_DAYS_PER_SIDE = 3;
const JACCARD_THRESHOLD = 0.5;
const MAX_LINKS_PER_NODE = 4;
const MAX_LINKS_TOTAL = 20;
const HIDDEN_ANCHOR_MAX_PERCENT = 60;
const HIDDEN_ANCHOR_MIN_DIFF = 15;
const MODERATE_DRAG_MIN_DIFF = 12;
const ANCHOR_COUNT = 3;

export type SynergyRawHabit = HabitSchedule & {
  id: string;
  name: string;
  area: BrainArea;
  percent: number;
  strengthKey: HabitStrengthKey;
};

export type SynergyRawLog = { habitId: string; date: string; status: LogStatus };

export type PartitionedHabit = SynergyRawHabit & { doneDays: Set<string>; notDoneDays: Set<string> };

export type SynergyNode = {
  id: string;
  name: string;
  area: BrainArea;
  percent: number;
  /** `null` = hábito al 100 % en los días elegibles: no hay "sin" con qué compararlo (nodo "base"). */
  diff: number | null;
  withOthers: number | null;
  withoutOthers: number | null;
  isAnchor: boolean;
  isHiddenAnchor: boolean;
  message: string;
};

export type SynergyLink = { a: string; b: string; score: number };

/**
 * Diámetro del punto de un nodo en SinergiasNetwork.tsx — exportado para que
 * sinergiasLayout.ts calcule la separación mínima entre dos nodos a partir
 * de su tamaño REAL (un hábito con diff alto puede llegar a ~125px de
 * diámetro) en vez de una distancia fija, que es justo lo que los dejaba
 * superpuestos en pantalla con hábitos de diff alto (visto en captura real).
 */
export function synergyNodeSize(diff: number | null): number {
  return diff === null ? 18 : Math.round(16 + diff * 1.1);
}

export type SynergyResult = {
  nodes: SynergyNode[];
  links: SynergyLink[];
  /** Hasta 3 ids, mayor `diff` primero. */
  anchorIds: string[];
  /** Hasta 4 ids: [vecino más fuerte, ancla principal, siguiente enlace, siguiente enlace]. */
  dominoChain: string[];
};

/** `dayCount` = días YA TRANSCURRIDOS del ciclo (no la duración total planeada) — "Sinergias" necesita historial real, no días futuros. */
export function hasEnoughDataForSynergies(dayCount: number): boolean {
  return dayCount >= MIN_CYCLE_DAYS_FOR_SYNERGIES;
}

/**
 * Reparte los días elegibles del hábito en "cumplido" / "no cumplido",
 * excluyendo los que no aplican — por horario/fecha de creación
 * (`isDateCountableForHabit`, igual criterio que el resto de la app) o por
 * un "NA" explícito del usuario. Ninguno de los dos cuenta para ningún lado.
 */
export function partitionDays(habit: SynergyRawHabit, days: string[], statusOf: (habitId: string, date: string) => LogStatus): PartitionedHabit {
  const doneDays = new Set<string>();
  const notDoneDays = new Set<string>();
  for (const day of days) {
    if (!isDateCountableForHabit(habit, day)) continue;
    const status = statusOf(habit.id, day);
    if (status === "NA") continue;
    if (status === "DONE") doneDays.add(day);
    else notDoneDays.add(day);
  }
  return { ...habit, doneDays, notDoneDays };
}

function isEligible(h: PartitionedHabit): boolean {
  if (h.strengthKey === "poda") return false;
  if (h.doneDays.size < MIN_DAYS_PER_SIDE) return false;
  return h.notDoneDays.size === 0 || h.notDoneDays.size >= MIN_DAYS_PER_SIDE;
}

/** % de cumplimiento de los DEMÁS hábitos elegibles (excluyendo `excludeId`) en UN día puntual — `null` si ninguno tiene dato ese día. */
function othersRateOnDay(day: string, excludeId: string, habits: PartitionedHabit[]): number | null {
  let done = 0;
  let total = 0;
  for (const h of habits) {
    if (h.id === excludeId) continue;
    if (h.doneDays.has(day)) {
      done += 1;
      total += 1;
    } else if (h.notDoneDays.has(day)) {
      total += 1;
    }
  }
  return total === 0 ? null : done / total;
}

/** Promedio de `othersRateOnDay` sobre un conjunto de días — promedio de tasas diarias (mismo criterio que calculateCompletionRateByDay), no un promedio ponderado por cantidad de hábitos con dato cada día. */
function avgOthersRate(days: Set<string>, excludeId: string, habits: PartitionedHabit[]): number | null {
  const rates: number[] = [];
  for (const day of days) {
    const r = othersRateOnDay(day, excludeId, habits);
    if (r !== null) rates.push(r);
  }
  if (rates.length === 0) return null;
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

function jaccard(h1: PartitionedHabit, h2: PartitionedHabit): number | null {
  let bothDone = 0;
  let eitherDone = 0;
  const tracked1 = new Set([...h1.doneDays, ...h1.notDoneDays]);
  for (const day of tracked1) {
    if (!h2.doneDays.has(day) && !h2.notDoneDays.has(day)) continue; // h2 no tiene dato determinado ese día
    const d1 = h1.doneDays.has(day);
    const d2 = h2.doneDays.has(day);
    if (d1 && d2) bothDone += 1;
    if (d1 || d2) eitherDone += 1;
  }
  return eitherDone === 0 ? null : bothDone / eitherDone;
}

/** Enlaces ≥0.5, ordenados de más fuerte a más débil, máx. 4 por nodo y `MAX_LINKS_TOTAL` en total — los más fuertes ganan primero. Exportada: la prueba del tope (4 por nodo / 20 en total) la llama directo con enlaces sintéticos, no hace falta armar hábitos reales para probar solo el empaquetado. */
export function selectLinks(candidates: SynergyLink[]): SynergyLink[] {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const countByNode = new Map<string, number>();
  const result: SynergyLink[] = [];
  for (const link of sorted) {
    if (result.length >= MAX_LINKS_TOTAL) break;
    const ca = countByNode.get(link.a) ?? 0;
    const cb = countByNode.get(link.b) ?? 0;
    if (ca >= MAX_LINKS_PER_NODE || cb >= MAX_LINKS_PER_NODE) continue;
    result.push(link);
    countByNode.set(link.a, ca + 1);
    countByNode.set(link.b, cb + 1);
  }
  return result;
}

/**
 * `isBase` (100 % de los días, sin "sin" con qué comparar) es la ÚNICA razón
 * real para `diff === null` — un hábito con días de sobra de los dos lados
 * pero SIN ningún otro hábito elegible en el ciclo (caso raro, de un ciclo
 * con casi nada más cargado) también da `diff === null` por falta de con
 * quién comparar, y merece su propio mensaje: nunca el de "100 %", que sería
 * un dato inventado para un hábito que en realidad no está en el 100 %.
 */
function synergyMessage(percent: number, diff: number | null, isAnchor: boolean, isBase: boolean): string {
  if (isBase) {
    return "Lo cumples el 100 % de los días: es parte de tu base. No se puede comparar con días sin él, pero sostiene la red y conecta con los hábitos de al lado.";
  }
  if (diff === null) {
    return "Todavía no hay otros hábitos elegibles este ciclo para comparar su efecto arrastre.";
  }
  if (percent < HIDDEN_ANCHOR_MAX_PERCENT && diff >= HIDDEN_ANCHOR_MIN_DIFF) {
    return `Ancla oculta: solo lo cumples el ${percent} % de los días, pero esos días todo lo demás sube. Experimento: 7 días seguidos y mira cómo cambia tu electroencefalograma.`;
  }
  if (isAnchor) {
    return "Es uno de tus 3 hábitos ancla: cuando aparece, el resto del día suele acompañarlo. Protégelo en tus días difíciles.";
  }
  return `Tiene un efecto arrastre ${diff >= MODERATE_DRAG_MIN_DIFF ? "moderado" : "leve"} sobre el resto de tu día. Su fuerza está en las conexiones de abajo.`;
}

/** [vecino más fuerte de `mainAnchorId`, `mainAnchorId`, hasta 2 siguientes enlaces más fuertes] — nunca repite un vecino, nunca inventa uno que no está enlazado. */
export function buildDominoChain(mainAnchorId: string, links: SynergyLink[]): string[] {
  const neighbors = links
    .filter((l) => l.a === mainAnchorId || l.b === mainAnchorId)
    .map((l) => ({ other: l.a === mainAnchorId ? l.b : l.a, score: l.score }))
    .sort((x, y) => y.score - x.score);

  if (neighbors.length === 0) return [mainAnchorId];
  const before = neighbors[0].other;
  const after = neighbors.slice(1, 3).map((n) => n.other);
  return [before, mainAnchorId, ...after];
}

/**
 * `days` = días YA TRANSCURRIDOS del ciclo (ver `resonance.byDay`), mismo
 * criterio "sin días futuros" que el resto de Resonancia del ciclo.
 * `statusOf` resuelve el status crudo persistido (o "PENDING" si no hay log)
 * — la exclusión por horario/creación la aplica `partitionDays` arriba, no
 * hace falta que el caller la resuelva.
 */
export function computeSynergies(habits: SynergyRawHabit[], days: string[], statusOf: (habitId: string, date: string) => LogStatus): SynergyResult {
  const partitioned = habits.map((h) => partitionDays(h, days, statusOf));
  const eligible = partitioned.filter(isEligible);

  const diffs = new Map<string, number | null>();
  const withs = new Map<string, number | null>();
  const withouts = new Map<string, number | null>();
  for (const h of eligible) {
    const withOthers = avgOthersRate(h.doneDays, h.id, eligible);
    const withoutOthers = h.notDoneDays.size > 0 ? avgOthersRate(h.notDoneDays, h.id, eligible) : null;
    withs.set(h.id, withOthers === null ? null : Math.round(withOthers * 100));
    withouts.set(h.id, withoutOthers === null ? null : Math.round(withoutOthers * 100));
    diffs.set(h.id, withOthers !== null && withoutOthers !== null ? Math.round((withOthers - withoutOthers) * 100) : null);
  }

  const anchorIds = eligible
    .map((h) => h.id)
    .filter((id) => diffs.get(id) !== null)
    .sort((a, b) => diffs.get(b)! - diffs.get(a)!)
    .slice(0, ANCHOR_COUNT);
  const anchorSet = new Set(anchorIds);

  const linkCandidates: SynergyLink[] = [];
  for (let i = 0; i < eligible.length; i++) {
    for (let j = i + 1; j < eligible.length; j++) {
      const score = jaccard(eligible[i], eligible[j]);
      if (score !== null && score >= JACCARD_THRESHOLD) {
        linkCandidates.push({ a: eligible[i].id, b: eligible[j].id, score });
      }
    }
  }
  const links = selectLinks(linkCandidates);

  const nodes: SynergyNode[] = eligible.map((h) => {
    const diff = diffs.get(h.id) ?? null;
    const isAnchor = anchorSet.has(h.id);
    return {
      id: h.id,
      name: h.name,
      area: h.area,
      percent: h.percent,
      diff,
      withOthers: withs.get(h.id) ?? null,
      withoutOthers: withouts.get(h.id) ?? null,
      isAnchor,
      isHiddenAnchor: diff !== null && h.percent < HIDDEN_ANCHOR_MAX_PERCENT && diff >= HIDDEN_ANCHOR_MIN_DIFF,
      message: synergyMessage(h.percent, diff, isAnchor, h.notDoneDays.size === 0),
    };
  });

  const dominoChain = anchorIds.length > 0 ? buildDominoChain(anchorIds[0], links) : [];

  return { nodes, links, anchorIds, dominoChain };
}
