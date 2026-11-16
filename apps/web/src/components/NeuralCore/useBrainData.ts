import { useCallback, useMemo } from "react";
import { useAdjustNeuralArea, useNeuralCoreSnapshot } from "../../api/neuralCore";
import type { CycleLogs } from "../../api/tracking";
import type { HabitPriorityLevel } from "../../domain";
import { isDateCountableForHabit, toDateOnlyISO } from "../../lib/completion";
import { todayISO } from "../../lib/date";
import { showToast } from "../../lib/toast";
import { AREA_OF_CATEGORY, BRAIN_AREAS, coreStateFor, type BrainArea } from "./brainTokens";
import { NEURAL_IMPULSE_POINTS } from "./tokens";
import { useBrainImpulseEngine, type AdjustArgs } from "./useBrainImpulseEngine";

const ZERO_AREA: Record<BrainArea, number> = { men: 0, emo: 0, fis: 0, esp: 0, eco: 0, hab: 0 };

/**
 * Datos del Cerebro Interactivo a partir del mismo `CycleLogs` que ya usa
 * Tracker.tsx/TrackerMatrix.tsx — sin pedir nada nuevo al backend. El área
 * de cada hábito sale de `habit.category` (mapeado a las 6 regiones vía
 * AREA_OF_CATEGORY); la prioridad define los puntos de impulso (3/2/1),
 * igual que en el Núcleo Neural de paso 1.
 */
export function useBrainData(data: CycleLogs) {
  const today = todayISO();

  const lookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const log of data.logs) map.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
    return map;
  }, [data.logs]);

  function effectiveStatus(habitId: string, date: string): string {
    return lookup.get(`${habitId}|${date}`) ?? "PENDING";
  }

  const countableToday = useMemo(
    () => data.habits.filter((h) => isDateCountableForHabit(h, today)),
    [data.habits, today],
  );

  const areaOf = useMemo(() => {
    const map: Record<string, BrainArea> = {};
    for (const h of countableToday) map[h.id] = AREA_OF_CATEGORY[h.category];
    return map;
  }, [countableToday]);

  const priorityOf = useMemo(() => {
    const map: Record<string, HabitPriorityLevel> = {};
    for (const h of countableToday) map[h.id] = h.priority;
    return map;
  }, [countableToday]);

  const habitIds = useMemo(() => countableToday.map((h) => h.id), [countableToday]);

  const doneMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const h of countableToday) map[h.id] = effectiveStatus(h.id, today) === "DONE";
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countableToday, lookup, today]);

  const maximoHoy = useMemo(
    () => countableToday.reduce((sum, h) => sum + NEURAL_IMPULSE_POINTS[h.priority], 0),
    [countableToday],
  );

  const doneAreaPoints = useMemo(() => {
    const map = { ...ZERO_AREA };
    for (const h of countableToday) {
      if (effectiveStatus(h.id, today) === "DONE") {
        map[AREA_OF_CATEGORY[h.category]] += NEURAL_IMPULSE_POINTS[h.priority];
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countableToday, lookup, today]);

  const doneHabitsCount = useMemo(
    () => countableToday.filter((h) => effectiveStatus(h.id, today) === "DONE").length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countableToday, lookup, today],
  );

  // Fuente de verdad real de impulsosDeVida (ver neuralCore.ts): se usa para
  // reconciliar UNA vez el caché local, y cada ajuste real se persiste acá.
  const { data: snapshot } = useNeuralCoreSnapshot();
  const serverLifetime = useMemo(() => {
    if (!snapshot) return undefined;
    const map = { ...ZERO_AREA };
    for (const stat of snapshot.areaStats) map[stat.area] = stat.impulsosDeVida;
    return map;
  }, [snapshot]);

  const adjustMutation = useAdjustNeuralArea();
  const onAdjust = useCallback(
    (args: AdjustArgs) => {
      adjustMutation.mutate(args, {
        onError: () => showToast("No se pudo guardar tu progreso del Núcleo Neural. Se reintentará más tarde."),
      });
    },
    [adjustMutation],
  );

  const { displayedAreaPoints, impulsosDeVida, impulses, flashes, synapseActive, lastEvent, lastFedArea, triggerTick } = useBrainImpulseEngine(
    habitIds,
    areaOf,
    priorityOf,
    doneMap,
    doneAreaPoints,
    maximoHoy,
    serverLifetime,
    onAdjust,
  );

  const totalImpulsosHoy = BRAIN_AREAS.reduce((sum, a) => sum + displayedAreaPoints[a], 0);
  const percent = maximoHoy > 0 ? (totalImpulsosHoy / maximoHoy) * 100 : 0;
  const coreState = coreStateFor(percent);

  // "Dato real" con historial (pedido explícito): un área queda "descubierta"
  // apenas recibió su primer impulso alguna vez — dato real (no inventado),
  // ya disponible en impulsosDeVida. El carrusel navega entre las
  // descubiertas; las demás se muestran bloqueadas.
  const discoveredAreas = BRAIN_AREAS.filter((a) => impulsosDeVida[a] > 0);

  return {
    areaOf,
    displayedAreaPoints,
    impulsosDeVida,
    impulses,
    flashes,
    synapseActive,
    lastEvent,
    lastFedArea,
    discoveredAreas,
    triggerTick,
    totalImpulsosHoy,
    maximoHoy,
    doneHabitsCount,
    percent,
    coreState,
  };
}
