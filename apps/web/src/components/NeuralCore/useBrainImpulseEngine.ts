import { useEffect, useRef, useState } from "react";
import type { HabitPriorityLevel } from "../../domain";
import {
  BRAIN_AREAS,
  BRAIN_AREA_LABEL,
  BRAIN_IDENTITY_PHRASE,
  BRAIN_REGION_NAME,
  coreStateFor,
  myelinStage,
  type BrainArea,
  type CoreStateKey,
  type MyelinStage,
} from "./brainTokens";
import { NEURAL_IMPULSE_POINTS, NEURAL_LIT_DELAY_MS } from "./tokens";
import { recordAreaImpulse, recordDailyState } from "./brainHistory";
import { todayISO } from "../../lib/date";

export type BrainImpulse = { id: string; area: BrainArea };
export type BrainFlash = { id: string; area: BrainArea };
export type LastEvent = { message: string; kind: "identity" | "state" | "count" | "initial" };

const BRAIN_IMPULSE_STEP_MS = 200;
const BRAIN_IMPULSE_TRAVEL_MS = 750;
const BRAIN_FLASH_MS = 320;

const ZERO_AREA: Record<BrainArea, number> = { men: 0, emo: 0, fis: 0, esp: 0, eco: 0, hab: 0 };
const INITIAL_EVENT: LastEvent = {
  message: "Completa un hábito y mira qué región de tu cerebro se fortalece.",
  kind: "initial",
};

// `impulsosDeVida` (sección 4/6 del pedido: "nunca se reinicia") no tiene
// todavía un agregado histórico real en el backend — solo existe el ciclo
// activo (ver useCycleLogs). Se persiste en localStorage, mismo criterio ya
// usado en dailyReviewTriggers.ts/applyLearningTriggers.ts: un detalle de
// este dispositivo, honesto sobre su alcance (acumula desde que esta
// función empezó a usarse acá, no reconstruye historia pasada que nunca se
// trackeó con este sistema de impulsos — ver nota en la entrega final).
const LIFETIME_STORAGE_KEY = "neural-core:lifetime-impulses:v1";

export function loadLifetime(): Record<BrainArea, number> {
  const base = { ...ZERO_AREA };
  try {
    const raw = localStorage.getItem(LIFETIME_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<Record<BrainArea, number>>;
    for (const area of BRAIN_AREAS) {
      if (typeof parsed[area] === "number") base[area] = parsed[area]!;
    }
  } catch {
    // Cortesía, no garantía — arranca en 0 si localStorage falla.
  }
  return base;
}

function saveLifetime(value: Record<BrainArea, number>) {
  try {
    localStorage.setItem(LIFETIME_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Cortesía, no garantía.
  }
}

/**
 * Motor de impulsos del Cerebro Interactivo. Generaliza useImpulseEngine.ts
 * (booleano `lit` por hábito) a un conteo acumulado por ÁREA: cada impulso
 * que llega suma +1 a `displayedAreaPoints[area]` y a `impulsosDeVida[area]`
 * de inmediato (sección 4: "al llegar CADA impulso..."), no recién con el
 * último — a diferencia del anillo de paso 1, acá no hay un booleano final
 * que "encender". El último impulso de la tanda de un hábito sí decide,
 * aparte, el mensaje de "último evento" (sección 7, prioridad: cambio de
 * etapa de mielina > cambio de estado del núcleo > conteo).
 */
export type AdjustArgs = {
  area: BrainArea;
  delta: number;
  date: string;
  coreState: CoreStateKey;
  totalImpulsesToday: number;
};

export function useBrainImpulseEngine(
  habitIds: string[],
  areaOf: Record<string, BrainArea>,
  priorityOf: Record<string, HabitPriorityLevel>,
  doneMap: Record<string, boolean>,
  doneAreaPoints: Record<BrainArea, number>,
  maximoHoy: number,
  // `impulsosDeVida` autoritativo del servidor (sección 1 del pedido: "no
  // puede perderse al cambiar de dispositivo") — cuando llega, reemplaza UNA
  // vez el valor leído de localStorage (que sigue siendo el caché de pintado
  // instantáneo mientras el fetch resuelve). `onAdjust` persiste cada
  // ajuste real al servidor — una llamada por SECUENCIA de hábito (al
  // marcar, cuando llega el último de sus k impulsos; al desmarcar, una
  // sola vez), no una por impulso individual.
  serverLifetime: Record<BrainArea, number> | undefined,
  onAdjust: ((args: AdjustArgs) => void) | undefined,
) {
  const [displayedAreaPoints, setDisplayedAreaPoints] = useState<Record<BrainArea, number>>(() => ({ ...ZERO_AREA }));
  const [impulsosDeVida, setImpulsosDeVida] = useState<Record<BrainArea, number>>(() => loadLifetime());
  const [impulses, setImpulses] = useState<BrainImpulse[]>([]);
  const [flashes, setFlashes] = useState<BrainFlash[]>([]);
  const [synapseCount, setSynapseCount] = useState<Record<BrainArea, number>>(() => ({ ...ZERO_AREA }));
  const [lastEvent, setLastEvent] = useState<LastEvent>(INITIAL_EVENT);
  // "Dato real" (sección 8): la última región que recibió un impulso. "men"
  // como default inicial — mismo que muestra la referencia visual — hasta
  // que llegue el primer impulso real de la sesión.
  const [lastFedArea, setLastFedArea] = useState<BrainArea>("men");
  // Sube en cada SECUENCIA de marcado nueva (no en cada impulso individual,
  // no al desmarcar) — pedido explícito: "que cada vez que se chequea un
  // hábito me suba al lóbulo frontal para ver cómo llegan los impulsos".
  // El widget observa este contador y hace scroll hacia sí mismo cuando
  // cambia (ver CerebroWidget.tsx) — el motor no toca el DOM directamente.
  const [triggerTick, setTriggerTick] = useState(0);

  const prevDoneRef = useRef<Record<string, boolean> | null>(null);
  const inFlightRef = useRef<Set<string>>(new Set());
  const cancelledHabitsRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Set<number>>(new Set());
  const reduceMotionRef = useRef(false);

  // Espejo síncrono de los dos contadores (ver resolveLastEvent): un
  // `setState` no se refleja de inmediato en la variable de estado, pero sí
  // en este ref, escrito dentro del propio updater — así el mensaje de
  // "último evento" siempre lee el valor ya actualizado, sin depender del
  // timing de React.
  const displayedAreaPointsRef = useRef(displayedAreaPoints);
  const impulsosDeVidaRef = useRef(impulsosDeVida);
  const prevMyelinStageRef = useRef<Record<BrainArea, MyelinStage>>(
    Object.fromEntries(BRAIN_AREAS.map((a) => [a, myelinStage(impulsosDeVida[a])])) as Record<BrainArea, MyelinStage>,
  );
  const prevCoreStateRef = useRef<CoreStateKey>("latente");
  const coreStateInitializedRef = useRef(false);

  // "Última versión" de los parámetros, leída desde refs (no desde los
  // argumentos directamente) para que el efecto de diff más abajo solo
  // dependa de `doneMap` de verdad — mismo criterio que useImpulseEngine.ts.
  const habitIdsRef = useRef(habitIds);
  const areaOfRef = useRef(areaOf);
  const priorityOfRef = useRef(priorityOf);
  const doneAreaPointsRef = useRef(doneAreaPoints);
  const maximoHoyRef = useRef(maximoHoy);
  const onAdjustRef = useRef(onAdjust);
  useEffect(() => {
    habitIdsRef.current = habitIds;
    areaOfRef.current = areaOf;
    priorityOfRef.current = priorityOf;
    doneAreaPointsRef.current = doneAreaPoints;
    maximoHoyRef.current = maximoHoy;
    onAdjustRef.current = onAdjust;

    if (!coreStateInitializedRef.current) {
      coreStateInitializedRef.current = true;
      const total = Object.values(doneAreaPoints).reduce((a, b) => a + b, 0);
      const percent = maximoHoy > 0 ? (total / maximoHoy) * 100 : 0;
      prevCoreStateRef.current = coreStateFor(percent).key;
    }
  });

  // Reconciliación ÚNICA con el servidor: cuando llega `serverLifetime` (la
  // consulta GET /neural-core resolvió), reemplaza el valor leído de
  // localStorage — importante si el usuario cambió de dispositivo y el
  // caché local está desactualizado o vacío. Solo una vez (no en cada
  // refetch en segundo plano) para no "saltar" números mientras el usuario
  // interactúa.
  const reconciledRef = useRef(false);
  useEffect(() => {
    if (!serverLifetime || reconciledRef.current) return;
    reconciledRef.current = true;
    impulsosDeVidaRef.current = serverLifetime;
    setImpulsosDeVida(serverLifetime);
    saveLifetime(serverLifetime);
    prevMyelinStageRef.current = Object.fromEntries(
      BRAIN_AREAS.map((a) => [a, myelinStage(serverLifetime[a])]),
    ) as Record<BrainArea, MyelinStage>;
  }, [serverLifetime]);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of timers) window.clearTimeout(id);
      timers.clear();
    };
  }, []);

  function scheduleTimeout(fn: () => void, delay: number) {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, delay);
    timersRef.current.add(id);
  }

  function applyAreaIncrement(area: BrainArea, amount: number) {
    setLastFedArea(area);
    setDisplayedAreaPoints((prev) => {
      const next = { ...prev, [area]: prev[area] + amount };
      displayedAreaPointsRef.current = next;
      return next;
    });
    setImpulsosDeVida((prev) => {
      const next = { ...prev, [area]: prev[area] + amount };
      impulsosDeVidaRef.current = next;
      saveLifetime(next);
      return next;
    });

    // Historial para "Mi mapa neuronal" (paso 3): fecha del último impulso
    // por área + estado del núcleo del día, actualizados en cada impulso
    // real (no hace falta un cierre de día aparte — la última escritura
    // antes de que cambie la fecha queda, de hecho, como el cierre).
    recordAreaImpulse(area);
    const total = Object.values(displayedAreaPointsRef.current).reduce((a, b) => a + b, 0);
    const percent = maximoHoyRef.current > 0 ? (total / maximoHoyRef.current) * 100 : 0;
    recordDailyState(percent, total);
  }

  /**
   * Desmarcar: resta tanto de hoy como de `impulsosDeVida` — esos impulsos
   * nunca fueron un cumplimiento real, no es lo mismo que la poda suave
   * (que atenúa circuitos usados y luego abandonados, pero nunca resta el
   * conteo). También recalcula y persiste el registro de hoy, para que la
   * franja de 30 días de "Mi mapa neuronal" quede correcta.
   */
  function applyAreaDecrement(area: BrainArea, amount: number) {
    setDisplayedAreaPoints((prev) => {
      const next = { ...prev, [area]: Math.max(0, prev[area] - amount) };
      displayedAreaPointsRef.current = next;
      return next;
    });
    setImpulsosDeVida((prev) => {
      const next = { ...prev, [area]: Math.max(0, prev[area] - amount) };
      impulsosDeVidaRef.current = next;
      saveLifetime(next);
      return next;
    });

    const total = Object.values(displayedAreaPointsRef.current).reduce((a, b) => a + b, 0);
    const percent = maximoHoyRef.current > 0 ? (total / maximoHoyRef.current) * 100 : 0;
    recordDailyState(percent, total);
    onAdjustRef.current?.({
      area,
      delta: -amount,
      date: todayISO(),
      coreState: coreStateFor(percent).key,
      totalImpulsesToday: total,
    });
  }

  function resolveLastEvent(area: BrainArea, k: number) {
    const newStage = myelinStage(impulsosDeVidaRef.current[area]);
    const oldStage = prevMyelinStageRef.current[area];
    if (newStage !== oldStage) {
      prevMyelinStageRef.current = { ...prevMyelinStageRef.current, [area]: newStage };
      setLastEvent({
        message: `${BRAIN_AREA_LABEL[area]} llegó a ${newStage}. ${BRAIN_IDENTITY_PHRASE[area]}`,
        kind: "identity",
      });
      return;
    }

    const total = Object.values(displayedAreaPointsRef.current).reduce((a, b) => a + b, 0);
    const percent = maximoHoyRef.current > 0 ? (total / maximoHoyRef.current) * 100 : 0;
    const newState = coreStateFor(percent);
    if (newState.key !== prevCoreStateRef.current) {
      prevCoreStateRef.current = newState.key;
      setLastEvent({
        message: `Desbloqueaste el estado ${newState.label}: ${newState.description}.`,
        kind: "state",
      });
      return;
    }

    setLastEvent({
      message: `+${k} impulsos a ${BRAIN_REGION_NAME[area]} (${BRAIN_AREA_LABEL[area]}). Ese circuito ya suma ${impulsosDeVidaRef.current[area]}.`,
      kind: "count",
    });
  }

  /** Persiste al servidor el resultado de UNA secuencia completa de marcado (sección: "una llamada por secuencia, no por impulso"). */
  function syncMarkToServer(area: BrainArea, totalK: number) {
    const total = Object.values(displayedAreaPointsRef.current).reduce((a, b) => a + b, 0);
    const percent = maximoHoyRef.current > 0 ? (total / maximoHoyRef.current) * 100 : 0;
    onAdjustRef.current?.({
      area,
      delta: totalK,
      date: todayISO(),
      coreState: coreStateFor(percent).key,
      totalImpulsesToday: total,
    });
  }

  function spawnImpulse(habitId: string, area: BrainArea, isLast: boolean, totalK: number) {
    if (cancelledHabitsRef.current.has(habitId)) {
      if (isLast) {
        inFlightRef.current.delete(habitId);
        cancelledHabitsRef.current.delete(habitId);
      }
      return;
    }

    const impulseId = `bimp-${habitId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setImpulses((prev) => [...prev, { id: impulseId, area }]);

    scheduleTimeout(() => {
      setImpulses((prev) => prev.filter((p) => p.id !== impulseId));

      const cancelled = cancelledHabitsRef.current.has(habitId);
      if (!cancelled) {
        const flashId = `${impulseId}-flash`;
        setFlashes((prev) => [...prev, { id: flashId, area }]);
        scheduleTimeout(() => {
          setFlashes((prev) => prev.filter((f) => f.id !== flashId));
        }, BRAIN_FLASH_MS);

        applyAreaIncrement(area, 1);
      }

      if (isLast) {
        scheduleTimeout(() => {
          setSynapseCount((prev) => ({ ...prev, [area]: Math.max(0, prev[area] - 1) }));
          inFlightRef.current.delete(habitId);
          const wasCancelled = cancelledHabitsRef.current.has(habitId);
          cancelledHabitsRef.current.delete(habitId);
          if (!wasCancelled) {
            resolveLastEvent(area, totalK);
            syncMarkToServer(area, totalK);
          }
        }, NEURAL_LIT_DELAY_MS);
      }
    }, BRAIN_IMPULSE_TRAVEL_MS);
  }

  function triggerHabitImpulses(habitId: string, area: BrainArea, priority: HabitPriorityLevel) {
    const k = NEURAL_IMPULSE_POINTS[priority];
    setTriggerTick((t) => t + 1);

    if (reduceMotionRef.current) {
      applyAreaIncrement(area, k);
      resolveLastEvent(area, k);
      syncMarkToServer(area, k);
      return;
    }

    cancelledHabitsRef.current.delete(habitId);
    setSynapseCount((prev) => ({ ...prev, [area]: prev[area] + 1 }));

    for (let i = 0; i < k; i++) {
      const isLast = i === k - 1;
      scheduleTimeout(() => spawnImpulse(habitId, area, isLast, k), i * BRAIN_IMPULSE_STEP_MS);
    }
  }

  useEffect(() => {
    const ids = habitIdsRef.current;
    const areas = areaOfRef.current;
    const priorities = priorityOfRef.current;
    const prevDone = prevDoneRef.current;

    if (prevDone === null) {
      // Primera carga: displayedAreaPoints = puntos reales de hoy, sin animación.
      const initial = { ...doneAreaPointsRef.current };
      displayedAreaPointsRef.current = initial;
      setDisplayedAreaPoints(initial);
    } else {
      for (const habitId of ids) {
        const wasDone = prevDone[habitId] ?? false;
        const isDone = doneMap[habitId] ?? false;
        if (!wasDone && isDone) {
          if (!inFlightRef.current.has(habitId)) {
            inFlightRef.current.add(habitId);
            triggerHabitImpulses(habitId, areas[habitId], priorities[habitId]);
          } else {
            cancelledHabitsRef.current.delete(habitId);
          }
        } else if (wasDone && !isDone) {
          cancelledHabitsRef.current.add(habitId);
          const area = areas[habitId];
          const k = NEURAL_IMPULSE_POINTS[priorities[habitId]];
          applyAreaDecrement(area, k);
        }
      }
    }

    prevDoneRef.current = doneMap;
  }, [doneMap]);

  const synapseActive: Record<BrainArea, boolean> = Object.fromEntries(
    BRAIN_AREAS.map((a) => [a, synapseCount[a] > 0]),
  ) as Record<BrainArea, boolean>;

  return { displayedAreaPoints, impulsosDeVida, impulses, flashes, synapseActive, lastEvent, lastFedArea, triggerTick };
}
