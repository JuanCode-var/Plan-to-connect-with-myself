import type { LogStatus } from "../../domain";
import type { BrainArea } from "../NeuralCore/brainTokens";
import { partitionDays, type PartitionedHabit, type SynergyNode, type SynergyRawHabit } from "./sinergiasLogic";

/**
 * "Cadena de caída" (ex "Patrones detectados" → tipo "chain") — puerto de
 * `findPassingPairs`/`detectChainPatterns`/`buildChainInsight` de
 * apps/api/src/services/insights.ts, pero:
 *  1. Recalculado del lado del cliente sobre los MISMOS datos del ciclo que
 *     ya usa Sinergias (`partitionDays`, de sinergiasLogic.ts — mismo
 *     criterio de "no aplica" que el resto de esta pantalla), no sobre el
 *     historial completo de todos los tiempos que usaba /api/insights.
 *  2. El ancla YA NO es "quién falla más por su cuenta dentro del grupo"
 *     (la vieja métrica, independiente de Sinergias) — pedido explícito del
 *     usuario: "el ancla de la cadena de caída y las anclas de Sinergias
 *     deben salir del MISMO módulo de cálculo". Acá se resuelve con
 *     `pickChainAnchor`, que SIEMPRE prioriza un miembro que YA es ancla
 *     global de Sinergias (mismo `diff` de sinergiasLogic.ts) antes que
 *     cualquier otro candidato — así nunca hay dos recomendaciones
 *     distintas para el mismo hábito.
 */

const MIN_PAIR_CO_FAILURES = 3;
const PAIR_RATIO_THRESHOLD = 1.5;
const CHAIN_HEATMAP_MAX_DAYS = 30;

export type CaidaChain = {
  habitIds: string[];
  habitNames: string[];
  areas: BrainArea[];
  sharedDays: number;
  coFailureDays: number;
  dailyPattern: { date: string; allFailed: boolean }[];
  anchorId: string | null;
  anchorName: string | null;
  summary: string;
};

type Edge = { a: PartitionedHabit; b: PartitionedHabit; sharedDays: string[]; bothFail: number; failDates: string[] };

function trackedDaysOf(h: PartitionedHabit): Set<string> {
  return new Set([...h.doneDays, ...h.notDoneDays]);
}

/** Pares de hábitos que quedan "no cumplido" el mismo día más seguido de lo que el azar explicaría. */
function findPassingPairs(habits: PartitionedHabit[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const a = habits[i];
      const b = habits[j];
      const trackedB = trackedDaysOf(b);
      const sharedDays = [...trackedDaysOf(a)].filter((d) => trackedB.has(d));
      if (sharedDays.length < MIN_PAIR_CO_FAILURES) continue;

      let aFail = 0;
      let bFail = 0;
      const failDates: string[] = [];
      for (const d of sharedDays) {
        const aPending = a.notDoneDays.has(d);
        const bPending = b.notDoneDays.has(d);
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

function sharedFailuresOf(members: PartitionedHabit[]): { sharedDays: string[]; failDates: string[] } {
  const trackedSets = members.map(trackedDaysOf);
  const sharedDays = [...trackedSets[0]].filter((d) => trackedSets.every((s) => s.has(d)));
  const failDates = sharedDays.filter((d) => members.every((m) => m.notDoneDays.has(d)));
  return { sharedDays, failDates };
}

/**
 * Único punto donde se elige el ancla de una cadena — pedido explícito:
 * "si una cadena incluye una de las anclas de Sinergias, recomienda esa".
 * 1º: el primer miembro (en orden de ranking global) que ya es ancla de
 * Sinergias. 2º, si ninguno lo es: el miembro con mayor `diff` propio
 * (mismo campo que ya calculó sinergiasLogic.ts, nunca una tasa aparte).
 * `null` si ningún miembro tiene un `diff` real con qué comparar.
 */
function pickChainAnchor(memberIds: string[], synergyNodesById: Map<string, SynergyNode>, synergyAnchorIds: string[]): SynergyNode | null {
  for (const anchorId of synergyAnchorIds) {
    if (memberIds.includes(anchorId)) return synergyNodesById.get(anchorId) ?? null;
  }
  let best: SynergyNode | null = null;
  for (const id of memberIds) {
    const node = synergyNodesById.get(id);
    if (!node || node.diff === null) continue;
    if (!best || node.diff! > best.diff!) best = node;
  }
  return best;
}

function buildChain(members: PartitionedHabit[], synergyNodesById: Map<string, SynergyNode>, synergyAnchorIds: string[]): CaidaChain {
  const { sharedDays, failDates } = sharedFailuresOf(members);
  const heatmapDays = sharedDays.slice(-CHAIN_HEATMAP_MAX_DAYS);
  const failSet = new Set(failDates);
  const dailyPattern = heatmapDays.map((d) => ({ date: d, allFailed: failSet.has(d) }));

  const anchor = members.length >= 3 ? pickChainAnchor(members.map((m) => m.id), synergyNodesById, synergyAnchorIds) : null;

  return {
    habitIds: members.map((m) => m.id),
    habitNames: members.map((m) => m.name),
    areas: members.map((m) => m.area),
    sharedDays: sharedDays.length,
    coFailureDays: failDates.length,
    dailyPattern,
    anchorId: anchor?.id ?? null,
    anchorName: anchor?.name ?? null,
    summary: `Estos ${members.length} hábitos suelen caer el mismo día`,
  };
}

/** Puntaje para elegir "la principal" cuando hay varias — mismo criterio que insights.ts::scoreInsight para `type: "chain"`. */
export function scoreCaidaChain(chain: CaidaChain): number {
  return chain.habitIds.length * chain.coFailureDays * 10;
}

export function computeCaidaChains(
  habits: SynergyRawHabit[],
  days: string[],
  statusOf: (habitId: string, date: string) => LogStatus,
  synergyNodesById: Map<string, SynergyNode>,
  synergyAnchorIds: string[],
): CaidaChain[] {
  const partitioned = habits.map((h) => partitionDays(h, days, statusOf));
  const edges = findPassingPairs(partitioned);
  if (edges.length === 0) return [];

  const hasEdge = new Set(edges.map((e) => `${e.a.id}|${e.b.id}`));
  const edgeConnects = (id1: string, id2: string) => hasEdge.has(`${id1}|${id2}`) || hasEdge.has(`${id2}|${id1}`);

  const assigned = new Set<string>();
  const chains: CaidaChain[] = [];
  const sortedEdges = [...edges].sort((a, b) => b.bothFail - a.bothFail);

  for (const seed of sortedEdges) {
    if (assigned.has(seed.a.id) || assigned.has(seed.b.id)) continue;

    let group = [seed.a, seed.b];
    let candidates = partitioned.filter((h) => !group.some((g) => g.id === h.id) && !assigned.has(h.id));

    let grew = true;
    while (grew) {
      grew = false;
      for (const cand of candidates) {
        if (!group.every((m) => edgeConnects(m.id, cand.id))) continue;
        const testGroup = [...group, cand];
        const testResult = sharedFailuresOf(testGroup);
        if (testResult.failDates.length >= MIN_PAIR_CO_FAILURES) {
          group = testGroup;
          candidates = candidates.filter((c) => c.id !== cand.id);
          grew = true;
          break;
        }
      }
    }

    if (group.length >= 3) {
      for (const m of group) assigned.add(m.id);
      chains.push(buildChain(group, synergyNodesById, synergyAnchorIds));
    }
  }

  // Lo que no quedó absorbido por una cadena de 3+ se reporta como su par original.
  for (const edge of edges) {
    if (assigned.has(edge.a.id) || assigned.has(edge.b.id)) continue;
    chains.push(buildChain([edge.a, edge.b], synergyNodesById, synergyAnchorIds));
  }

  return chains.sort((a, b) => scoreCaidaChain(b) - scoreCaidaChain(a));
}
