import { Router } from "express";
import { prisma } from "../db";
import { enumerateDaysISO, todayLocalISO } from "../date-utils";
import {
  calculateCompletionRate,
  calculateCompletionRateByDay,
  calculateCompletionRateByHabit,
  isDateCountableForHabit,
  toDateOnlyISO,
  type TrackedHabit,
  type TrackedLog,
} from "../services/tracking";

const router = Router();

// Los 5 contadores específicos del dashboard apuntan al hábito correspondiente
// por `name` exacto (nunca por posición en un arreglo) — ver seed.ts para el
// texto exacto de cada nombre. Si el hábito fue pausado o no existe, el
// contador correspondiente da 0 en vez de romper la respuesta.
const SPECIFIC_COUNTERS = [
  { key: "noBettingDays", habitName: "Cero apuestas" },
  { key: "noAlcoholDays", habitName: "Cero alcohol" },
  { key: "trainingDays", habitName: "Entrenamiento o movimiento" },
  { key: "studyDays", habitName: "Bloque de estudio" },
  { key: "emotionalLogDays", habitName: "Registro emocional y autoconocimiento" },
] as const;

/**
 * Aplana hábitos x días a una lista de estados "efectivos", igual criterio que
 * `calculateCompletionRateByHabit`/`ByDay` en services/tracking.ts: un día
 * anterior a la creación del hábito cuenta como no contable (tratado como
 * `NA`), y una celda sin log persistido se trata como `PENDING`. Se usa para
 * los totales (DONE/PENDING/NA) y el % general — la división en sí siempre
 * pasa por `calculateCompletionRate`, nunca se reimplementa acá.
 */
function buildGridStatuses(
  habits: TrackedHabit[],
  days: string[],
  logs: TrackedLog[],
): string[] {
  const lookup = new Map<string, string>();
  for (const log of logs) {
    lookup.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
  }

  const statuses: string[] = [];
  for (const habit of habits) {
    for (const day of days) {
      if (!isDateCountableForHabit(habit.createdAt, day)) {
        statuses.push("NA");
        continue;
      }
      statuses.push(lookup.get(`${habit.id}|${day}`) ?? "PENDING");
    }
  }
  return statuses;
}

function countTotals(statuses: string[]): { done: number; pending: number; na: number } {
  let done = 0;
  let pending = 0;
  let na = 0;
  for (const status of statuses) {
    if (status === "DONE") done += 1;
    else if (status === "PENDING") pending += 1;
    else na += 1;
  }
  return { done, pending, na };
}

router.get("/compare", async (req, res) => {
  const cycles = await prisma.cycle.findMany({ where: { userId: req.userId! }, orderBy: { startDate: "asc" } });
  // Todos los hábitos (activos y pausados): un hábito pausado conserva su
  // historial y sigue contando en el dashboard histórico (habit-catalog spec,
  // Scenario "Pausar un hábito").
  const habits = await prisma.habit.findMany({ where: { userId: req.userId! } });

  const result = await Promise.all(
    cycles.map(async (cycle) => {
      const logs = await prisma.habitLog.findMany({ where: { cycleId: cycle.id } });
      const days = enumerateDaysISO(cycle.startDate, cycle.endDate);
      const statuses = buildGridStatuses(habits, days, logs);
      return {
        id: cycle.id,
        name: cycle.name,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        completionRate: calculateCompletionRate(statuses),
      };
    }),
  );

  res.json(result);
});

router.get("/:cycleId", async (req, res) => {
  const cycle = await prisma.cycle.findFirst({ where: { id: req.params.cycleId, userId: req.userId! } });
  if (!cycle) {
    res.status(404).json({ error: "Ciclo no encontrado" });
    return;
  }

  // Todos los hábitos (activos y pausados): un hábito pausado conserva su
  // historial y sigue contando en el dashboard histórico (habit-catalog spec,
  // Scenario "Pausar un hábito").
  const habits = await prisma.habit.findMany({ where: { userId: req.userId! }, orderBy: { sortOrder: "asc" } });

  // Solo los HabitLog propios de este ciclo (por cycleId) — nunca se mezclan
  // logs de otro ciclo aunque las fechas se solapen.
  const logs = await prisma.habitLog.findMany({ where: { cycleId: cycle.id } });

  const days = enumerateDaysISO(cycle.startDate, cycle.endDate);

  const gridStatuses = buildGridStatuses(habits, days, logs);
  const totals = countTotals(gridStatuses);
  const completionRate = calculateCompletionRate(gridStatuses);

  const byHabitRates = calculateCompletionRateByHabit(habits, days, logs);
  const byHabit = habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    category: habit.category,
    priority: habit.priority,
    completionRate: byHabitRates[habit.id],
  }));

  // Tendencia diaria: recortada a los días ya transcurridos si el ciclo activo
  // termina en el futuro — nunca se rellenan los días faltantes con 0%, se
  // omiten directamente del arreglo.
  const todayISO = todayLocalISO();
  const elapsedDays = days.filter((day) => day <= todayISO);
  const byDayRates = calculateCompletionRateByDay(habits, elapsedDays, logs);
  const byDay = elapsedDays.map((day) => ({
    date: day,
    completionRate: byDayRates[day],
  }));

  // Contadores específicos: buscan el hábito por nombre exacto entre TODOS los
  // hábitos (incluidos los pausados, ya presentes en `habits` arriba), porque
  // un hábito pausado durante el ciclo igual debe reflejar su historial de
  // DONE dentro de ese ciclo.
  const counters: Record<string, number> = {};
  for (const { key, habitName } of SPECIFIC_COUNTERS) {
    const habit = habits.find((h) => h.name === habitName);
    counters[key] = habit
      ? logs.filter(
          (log) =>
            log.habitId === habit.id &&
            log.status === "DONE" &&
            isDateCountableForHabit(habit.createdAt, toDateOnlyISO(log.date)),
        ).length
      : 0;
  }

  res.json({
    cycle: {
      id: cycle.id,
      name: cycle.name,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
    },
    totals,
    completionRate,
    counters,
    byHabit,
    byDay,
  });
});

export default router;
