import { useMemo } from "react";
import type { CycleLogs } from "../../api/tracking";
import type { HabitPriorityLevel } from "../../domain";
import { isDateCountableForHabit, toDateOnlyISO } from "../../lib/completion";
import { addDaysISO, todayISO } from "../../lib/date";
import { useImpulseEngine } from "./useImpulseEngine";
import { NEURAL_PRIORITY_ORDER } from "./tokens";

export type WeekBar = { label: string; rate: number; isToday: boolean };

const WEEKDAY_INITIALS = ["D", "L", "M", "M", "J", "V", "S"];

/**
 * Datos derivados del Núcleo Neural a partir del mismo `CycleLogs` que ya
 * reciben Tracker.tsx/TrackerMatrix.tsx — sin pedir nada nuevo al backend.
 * Todo lo que se muestra (segmentos, donuts, %, insight, barra "Hoy") sale
 * de `lit` (vía useImpulseEngine), nunca de `done` directamente.
 */
export function useNeuralCoreData(data: CycleLogs) {
  const today = todayISO();

  const lookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const log of data.logs) {
      map.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
    }
    return map;
  }, [data.logs]);

  function effectiveStatus(habitId: string, date: string): string {
    return lookup.get(`${habitId}|${date}`) ?? "PENDING";
  }

  const countableToday = useMemo(
    () => data.habits.filter((h) => isDateCountableForHabit(h, today)),
    [data.habits, today],
  );

  // Orden del anillo: alta → media → baja (sección 3 del pedido),
  // conservando el orden relativo original dentro de cada prioridad.
  const orderedHabits = useMemo(() => {
    const rank: Record<HabitPriorityLevel, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };
    return [...countableToday].sort((a, b) => rank[a.priority] - rank[b.priority]);
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

  const { lit, impulses, flashes, synapseActive } = useImpulseEngine(habitIds, priorityOf, doneMap);

  const isLit = (habitId: string) => lit[habitId] ?? doneMap[habitId] ?? false;

  const totalToday = countableToday.length;
  const doneToday = countableToday.filter((h) => isLit(h.id)).length;
  const overallRate = totalToday === 0 ? 0 : doneToday / totalToday;

  const priorityStats = NEURAL_PRIORITY_ORDER.map((level) => {
    const habitsInLevel = countableToday.filter((h) => h.priority === level);
    const doneInLevel = habitsInLevel.filter((h) => isLit(h.id)).length;
    return { level, done: doneInLevel, total: habitsInLevel.length };
  });

  const altaStats = priorityStats.find((s) => s.level === "ALTA");
  const altaPendingCount = altaStats ? altaStats.total - altaStats.done : 0;

  // Últimos 7 días (incluye hoy): mismo historial ya cargado en `data`
  // (días/logs del ciclo activo), sin pedir nada nuevo. Un día fuera del
  // rango del ciclo (`data.days`) se muestra en 0% — es el dato real (ese
  // día no se trackeó), no un relleno inventado.
  const weekBars: WeekBar[] = useMemo(() => {
    const bars: WeekBar[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = addDaysISO(today, -i);
      const isToday = i === 0;
      let rate: number;
      if (isToday) {
        rate = overallRate;
      } else if (!data.days.includes(date)) {
        rate = 0;
      } else {
        const habitsThatDay = data.habits.filter((h) => isDateCountableForHabit(h, date));
        const doneThatDay = habitsThatDay.filter((h) => effectiveStatus(h.id, date) === "DONE").length;
        rate = habitsThatDay.length === 0 ? 0 : doneThatDay / habitsThatDay.length;
      }
      const [, m, d] = date.split("-").map(Number);
      const weekday = new Date(Number(date.slice(0, 4)), m - 1, d).getDay();
      bars.push({ label: isToday ? "Hoy" : WEEKDAY_INITIALS[weekday], rate, isToday });
    }
    return bars;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.days, data.habits, lookup, today, overallRate]);

  return {
    orderedHabits,
    isLit,
    impulses,
    flashes,
    synapseActive,
    totalToday,
    doneToday,
    overallRate,
    priorityStats,
    altaPendingCount,
    weekBars,
  };
}
