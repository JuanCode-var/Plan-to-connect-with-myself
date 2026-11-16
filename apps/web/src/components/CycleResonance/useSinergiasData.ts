import { useMemo } from "react";
import { useHabits } from "../../api/habits";
import { computeCaidaChains } from "./caidaChainLogic";
import { computeSynergies, hasEnoughDataForSynergies, type SynergyRawHabit } from "./sinergiasLogic";
import type { useCycleResonance } from "./useCycleResonance";

type Resonance = ReturnType<typeof useCycleResonance>;

/**
 * Orquestación compartida de "Sinergias" + "Cadena de caída" — usada tanto
 * por SinergiasTab.tsx (el render completo) como por Dashboard.tsx (solo
 * necesita el conteo de cadenas para la franja "{M} cadenas de caída →").
 * Un solo lugar evita que las dos partes de la app terminen calculando
 * anclas por separado y mostrando recomendaciones distintas.
 */
export function useSinergiasData(resonance: Resonance) {
  const { data: habitsFull } = useHabits();

  const days = useMemo(() => resonance.byDay.map((d) => d.date), [resonance.byDay]);

  const rawHabits: SynergyRawHabit[] = useMemo(() => {
    if (!habitsFull) return [];
    return resonance.byHabit.map((h) => {
      const full = habitsFull.find((x) => x.id === h.id);
      return {
        id: h.id,
        name: h.name,
        area: h.area,
        percent: h.percent,
        strengthKey: h.strength.key,
        createdAt: full?.createdAt ?? resonance.cycle?.startDate ?? "1970-01-01",
        activeWeekdays: full?.activeWeekdays ?? null,
      };
    });
  }, [resonance.byHabit, resonance.cycle, habitsFull]);

  const result = useMemo(
    () => computeSynergies(rawHabits, days, resonance.statusOf),
    // Ver useCycleResonance.ts: `resonance.statusOf` lee de `habitLogs`, ya
    // cubierto por `rawHabits`/`days` — no hace falta sumar la referencia de
    // la función en sí, que cambia cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawHabits, days],
  );

  const synergyNodesById = useMemo(() => new Map(result.nodes.map((n) => [n.id, n])), [result.nodes]);

  const chains = useMemo(
    () => computeCaidaChains(rawHabits, days, resonance.statusOf, synergyNodesById, result.anchorIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawHabits, days, synergyNodesById, result.anchorIds],
  );

  return {
    ready: !!habitsFull && !resonance.isLoading,
    enoughData: hasEnoughDataForSynergies(days.length),
    days,
    rawHabits,
    result,
    synergyNodesById,
    chains,
  };
}
