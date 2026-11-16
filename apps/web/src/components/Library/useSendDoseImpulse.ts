import { useCallback, useMemo } from "react";
import { useHabits } from "../../api/habits";
import { useAdjustNeuralArea, useNeuralCoreSnapshot } from "../../api/neuralCore";
import { isDateCountableForHabit } from "../../lib/completion";
import { todayISO } from "../../lib/date";
import { coreStateFor, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_IMPULSE_POINTS } from "../NeuralCore/tokens";

/**
 * Manda 1 impulso real a un área, REUTILIZANDO el mismo endpoint que ya usa
 * el Cerebro Interactivo al marcar un hábito (POST /neural-core/adjust, ver
 * useBrainImpulseEngine.ts/useBrainData.ts) — nunca un motor aparte. La
 * diferencia es que acá el impulso no nace de marcar un hábito puntual, así
 * que `coreState`/`totalImpulsesToday` (que ese endpoint espera que el
 * CLIENTE ya haya calculado) se recalculan acá mismo: mismo `maximoHoy`
 * (suma de puntos de prioridad de los hábitos contables hoy) y el total de
 * impulsos de HOY ya persistido (snapshot del servidor) + 1.
 */
export function useSendDoseImpulse() {
  const { data: habits } = useHabits();
  const { data: snapshot } = useNeuralCoreSnapshot();
  const adjust = useAdjustNeuralArea();

  const maximoHoy = useMemo(() => {
    if (!habits) return 0;
    const today = todayISO();
    return habits
      .filter((h) => isDateCountableForHabit(h, today))
      .reduce((sum, h) => sum + NEURAL_IMPULSE_POINTS[h.priority], 0);
  }, [habits]);

  const sendImpulse = useCallback(
    (area: BrainArea) => {
      const today = todayISO();
      const currentToday = snapshot?.dailyStates.find((d) => d.date.slice(0, 10) === today)?.impulses ?? 0;
      const totalImpulsesToday = currentToday + 1;
      const percent = maximoHoy > 0 ? (totalImpulsesToday / maximoHoy) * 100 : 100;
      adjust.mutate({ area, delta: 1, date: today, coreState: coreStateFor(percent).key, totalImpulsesToday });
    },
    [adjust, maximoHoy, snapshot],
  );

  return { sendImpulse, ready: !!habits && !!snapshot };
}
