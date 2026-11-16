import type { BrainArea } from "../NeuralCore/brainTokens";
import type { ResonanceArea } from "./useCycleResonance";

export type CommitmentAreaContribution = { area: BrainArea; percent: number };

/**
 * Mezcla los compromisos de "Mi Palabra" (con área asignada) en el % por
 * área del Cerebro del ciclo/hexágono — pedido explícito: "Económica no
 * debe aparecer vacía si hay un compromiso de ahorro activo". Cada
 * compromiso cuenta como UN dato más en el promedio de su área (mismo
 * criterio no ponderado que ya usa `computeByArea` entre hábitos), con su %
 * de progreso de plazo (`calculateWordProgress`, ver wordProgress.ts) como
 * si fuera el % de un hábito más — nunca convierte un área sin hábitos en
 * "0%" a secas, la vuelve real con el dato que sí existe.
 */
export function blendCommitmentsIntoAreas(byArea: ResonanceArea[], contributions: CommitmentAreaContribution[]): ResonanceArea[] {
  return byArea.map((entry) => {
    const matching = contributions.filter((c) => c.area === entry.area);
    if (matching.length === 0) return entry;

    const existingSum = (entry.percent ?? 0) * entry.habitCount;
    const addedSum = matching.reduce((sum, c) => sum + c.percent, 0);
    const count = entry.habitCount + matching.length;
    return { ...entry, percent: Math.round((existingSum + addedSum) / count), habitCount: count };
  });
}
