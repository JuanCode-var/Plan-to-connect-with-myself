import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { enumerateDaysISO, parseDateOnlyToUtcMidnight } from "../date-utils";
import { getActiveCycle } from "../services/tracking";

const router = Router();

router.get("/", async (_req, res) => {
  const cycles = await prisma.cycle.findMany({ orderBy: { startDate: "asc" } });
  const activeCycle = getActiveCycle(cycles);

  // `isActive` es la única fuente de verdad de "cuál es el ciclo activo": el
  // frontend lo lee de acá en vez de reimplementar el criterio (evita que las
  // dos implementaciones se desincronicen).
  res.json(cycles.map((cycle) => ({ ...cycle, isActive: cycle.id === activeCycle?.id })));
});

const createCycleSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

router.post("/", async (req, res) => {
  const parsed = createCycleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  let startDate: Date;
  let endDate: Date;
  try {
    startDate = parseDateOnlyToUtcMidnight(parsed.data.startDate);
    endDate = parseDateOnlyToUtcMidnight(parsed.data.endDate);
  } catch {
    res.status(400).json({ error: "Fechas inválidas, se espera YYYY-MM-DD" });
    return;
  }

  const cycle = await prisma.cycle.create({
    data: { name: parsed.data.name, startDate, endDate },
  });
  res.status(201).json(cycle);
});

router.delete("/:id", async (req, res) => {
  const cycle = await prisma.cycle.findUnique({ where: { id: req.params.id } });
  if (!cycle) {
    res.status(404).json({ error: "Ciclo no encontrado" });
    return;
  }

  // Borrar el ciclo se lleva sus HabitLog y sus Goal (con los GoalStep de
  // cada una): fuera de su ciclo ni unos ni otras tienen sentido propio
  // (decisión explícita del usuario, no un default de Prisma — ninguna de
  // estas relaciones tiene onDelete: Cascade en el schema).
  const goalIds = (await prisma.goal.findMany({ where: { cycleId: cycle.id }, select: { id: true } })).map(
    (g) => g.id,
  );
  await prisma.$transaction([
    prisma.goalStep.deleteMany({ where: { goalId: { in: goalIds } } }),
    prisma.goal.deleteMany({ where: { cycleId: cycle.id } }),
    prisma.habitLog.deleteMany({ where: { cycleId: cycle.id } }),
    prisma.cycle.delete({ where: { id: cycle.id } }),
  ]);

  res.status(204).send();
});

router.get("/:id/logs", async (req, res) => {
  const cycle = await prisma.cycle.findUnique({ where: { id: req.params.id } });
  if (!cycle) {
    res.status(404).json({ error: "Ciclo no encontrado" });
    return;
  }

  const days = enumerateDaysISO(cycle.startDate, cycle.endDate);

  const habits = await prisma.habit.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const logs = await prisma.habitLog.findMany({
    where: {
      habitId: { in: habits.map((h) => h.id) },
      date: { gte: cycle.startDate, lte: cycle.endDate },
    },
  });

  res.json({ cycle, days, habits, logs });
});

export default router;
