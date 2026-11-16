import { useMemo } from "react";
import { useDoseProgress, useDoses } from "../../api/doses";
import { addDaysISO, todayISO } from "../../lib/date";
import { AREA_OF_CATEGORY, type BrainArea } from "../NeuralCore/brainTokens";
import { computeDoseStreak, resolveHookText, selectDailyDose, type YesterdayPendingHabit } from "./doseSelector";
import type { useCycleResonance } from "../CycleResonance/useCycleResonance";

type Resonance = ReturnType<typeof useCycleResonance>;

/**
 * "TU DOSIS DEL DÍA" — junta los datos reales (doseSelector.ts es puro, acá
 * se lo alimenta con `resonance.byArea`/`byHabit` del ciclo activo, más el
 * historial de dosis completadas) y resuelve el gancho con el hábito
 * pendiente de ayer, si lo hay.
 */
export function useDailyDose(resonance: Resonance) {
  const { data: doses, isLoading: dosesLoading } = useDoses();
  const { data: doseProgress, isLoading: progressLoading } = useDoseProgress();

  const completedDoseIds = useMemo(() => new Set((doseProgress ?? []).map((p) => p.doseId)), [doseProgress]);

  const lastCompletedAtByDoseId = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of doseProgress ?? []) {
      const prev = map.get(p.doseId);
      if (!prev || p.date > prev) map.set(p.doseId, p.date);
    }
    return map;
  }, [doseProgress]);

  const yesterdayPendingHighPriorityHabitByArea = useMemo(() => {
    const map: Partial<Record<BrainArea, YesterdayPendingHabit>> = {};
    const yesterday = addDaysISO(todayISO(), -1);
    for (const h of resonance.byHabit) {
      if (h.priority !== "ALTA" || map[h.area]) continue;
      if (resonance.statusOf(h.id, yesterday) === "PENDING") {
        map[h.area] = { id: h.id, name: h.name };
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resonance.byHabit]);

  const selection = useMemo(() => {
    if (!doses) return null;
    return selectDailyDose({
      byAreaPercent: Object.fromEntries(resonance.byArea.map((a) => [a.area, a.percent])),
      doses: doses.map((d) => ({ id: d.id, area: AREA_OF_CATEGORY[d.area] })),
      completedDoseIds,
      lastCompletedAtByDoseId,
      yesterdayPendingHighPriorityHabitByArea,
    });
  }, [doses, resonance.byArea, completedDoseIds, lastCompletedAtByDoseId, yesterdayPendingHighPriorityHabitByArea]);

  const dose = useMemo(() => (selection ? (doses?.find((d) => d.id === selection.doseId) ?? null) : null), [doses, selection]);

  const today = todayISO();
  const completedToday = (doseProgress ?? []).some((p) => p.date === today);
  const streak = computeDoseStreak((doseProgress ?? []).map((p) => p.date), today);

  const hookText = dose ? resolveHookText(dose.hookTemplate, selection?.yesterdayHabitForHook ?? null) : null;

  return {
    ready: !dosesLoading && !progressLoading,
    dose,
    area: selection?.area ?? null,
    hookText,
    completedToday,
    streak,
  };
}
