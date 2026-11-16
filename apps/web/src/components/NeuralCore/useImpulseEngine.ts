import { useEffect, useRef, useState } from "react";
import type { HabitPriorityLevel } from "../../domain";
import {
  NEURAL_IMPULSE_POINTS,
  NEURAL_IMPULSE_STEP_MS,
  NEURAL_IMPULSE_TRAVEL_MS,
  NEURAL_FLASH_MS,
  NEURAL_LIT_DELAY_MS,
} from "./tokens";

export type NeuralImpulse = { id: string; priority: HabitPriorityLevel };
export type NeuralFlash = { id: string; priority: HabitPriorityLevel };

type SynapseCount = Record<HabitPriorityLevel, number>;

const ZERO_COUNT: SynapseCount = { ALTA: 0, MEDIA: 0, BAJA: 0 };

/**
 * Motor de impulsos del Núcleo Neural (sección 7 del pedido). Separa `done`
 * (lo que ya cambió en el checklist — TrackerMatrix.tsx, vía el cache
 * compartido de React Query) de `lit` (lo que pinta este widget): al marcar
 * un hábito, se detecta la transición PENDING→DONE comparando `doneMap`
 * entre renders, se lanzan sus impulsos, y recién cuando llega el ÚLTIMO
 * impulso se pone `lit = true` — todos los números/segmentos/donuts del
 * widget leen `lit`, nunca `done` directamente. No hay un callback del
 * checklist al que "suscribirse": este diff sobre `doneMap` (ya memoizado
 * por el llamador) es el único punto de enganche posible, ver resumen
 * entregado antes de escribir este archivo.
 */
export function useImpulseEngine(
  habitIds: string[],
  priorityOf: Record<string, HabitPriorityLevel>,
  doneMap: Record<string, boolean>,
) {
  const [lit, setLit] = useState<Record<string, boolean>>({});
  const [impulses, setImpulses] = useState<NeuralImpulse[]>([]);
  const [flashes, setFlashes] = useState<NeuralFlash[]>([]);
  const [synapseCount, setSynapseCount] = useState<SynapseCount>(ZERO_COUNT);

  const prevDoneRef = useRef<Record<string, boolean> | null>(null);
  const inFlightRef = useRef<Set<string>>(new Set());
  const cancelledRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Set<number>>(new Set());
  const reduceMotionRef = useRef(false);
  // Última versión de habitIds/priorityOf leída desde un ref (no desde los
  // parámetros directamente): así el efecto de diff más abajo solo depende
  // de `doneMap` de verdad — una nueva identidad de array/objeto en cada
  // render (habitIds/priorityOf se recalculan siempre en el llamador) no
  // debe re-disparar el diff por sí sola. Se sincroniza en un efecto (no
  // durante el render) para no mutar un ref fuera de un event handler/efecto.
  const habitIdsRef = useRef(habitIds);
  const priorityOfRef = useRef(priorityOf);
  useEffect(() => {
    habitIdsRef.current = habitIds;
    priorityOfRef.current = priorityOf;
  });

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

  function spawnImpulse(habitId: string, priority: HabitPriorityLevel, isLast: boolean) {
    const impulseId = `imp-${habitId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setImpulses((prev) => [...prev, { id: impulseId, priority }]);

    scheduleTimeout(() => {
      setImpulses((prev) => prev.filter((p) => p.id !== impulseId));

      const flashId = `${impulseId}-flash`;
      setFlashes((prev) => [...prev, { id: flashId, priority }]);
      scheduleTimeout(() => {
        setFlashes((prev) => prev.filter((f) => f.id !== flashId));
      }, NEURAL_FLASH_MS);

      if (isLast) {
        scheduleTimeout(() => {
          setSynapseCount((prev) => ({ ...prev, [priority]: Math.max(0, prev[priority] - 1) }));
          inFlightRef.current.delete(habitId);
          const wasCancelled = cancelledRef.current.has(habitId);
          cancelledRef.current.delete(habitId);
          if (!wasCancelled) {
            setLit((prev) => ({ ...prev, [habitId]: true }));
          }
        }, NEURAL_LIT_DELAY_MS);
      }
    }, NEURAL_IMPULSE_TRAVEL_MS);
  }

  function triggerImpulses(habitId: string, priority: HabitPriorityLevel) {
    if (reduceMotionRef.current) {
      setLit((prev) => ({ ...prev, [habitId]: true }));
      return;
    }
    inFlightRef.current.add(habitId);
    cancelledRef.current.delete(habitId);
    setSynapseCount((prev) => ({ ...prev, [priority]: prev[priority] + 1 }));

    const count = NEURAL_IMPULSE_POINTS[priority];
    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      scheduleTimeout(() => spawnImpulse(habitId, priority, isLast), i * NEURAL_IMPULSE_STEP_MS);
    }
  }

  useEffect(() => {
    const ids = habitIdsRef.current;
    const priorities = priorityOfRef.current;
    const prevDone = prevDoneRef.current;

    if (prevDone === null) {
      // Primera carga: lit = done, sin animación (sección 7).
      setLit(Object.fromEntries(ids.map((id) => [id, doneMap[id] ?? false])));
    } else {
      for (const habitId of ids) {
        const wasDone = prevDone[habitId] ?? false;
        const isDone = doneMap[habitId] ?? false;
        if (!wasDone && isDone) {
          if (!inFlightRef.current.has(habitId)) {
            triggerImpulses(habitId, priorities[habitId]);
          } else {
            // Ya hay una tanda de impulsos en curso para este hábito (p.ej.
            // se desmarcó y se volvió a marcar rápido, antes de que
            // terminara): no se relanza una segunda tanda, pero si había
            // quedado cancelada la iluminación final, se repone — el
            // estado real actual vuelto a ser "cumplido".
            cancelledRef.current.delete(habitId);
          }
        } else if (wasDone && !isDone) {
          // Desmarcado: done y lit = false de inmediato. Si había impulsos
          // viajando para este hábito, `cancelledRef` evita que lo
          // enciendan al llegar (ver spawnImpulse → rama `isLast`).
          cancelledRef.current.add(habitId);
          setLit((prev) => (prev[habitId] ? { ...prev, [habitId]: false } : prev));
        }
      }
    }

    prevDoneRef.current = doneMap;
  }, [doneMap]);

  const synapseActive: Record<HabitPriorityLevel, boolean> = {
    ALTA: synapseCount.ALTA > 0,
    MEDIA: synapseCount.MEDIA > 0,
    BAJA: synapseCount.BAJA > 0,
  };

  return { lit, impulses, flashes, synapseActive };
}
