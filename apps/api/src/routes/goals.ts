import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { parseDateOnlyToUtcMidnight } from "../date-utils";
import { goalStatusSchema } from "../domain";

const router = Router();

// GET /api/goals?cycleId=... — metas de un ciclo, con sus pasos ya
// incluidos (evita un segundo viaje por cada tarjeta en /metas). `userId`
// en el filtro alcanza para que no se devuelvan metas ajenas aunque alguien
// pase el cycleId de otra cuenta (no hay fila de Goal que tenga ese
// cycleId Y este userId a la vez).
router.get("/", async (req, res) => {
  const cycleId = typeof req.query.cycleId === "string" ? req.query.cycleId : undefined;
  if (!cycleId) {
    res.status(400).json({ error: "Falta cycleId" });
    return;
  }

  const goals = await prisma.goal.findMany({
    where: { cycleId, userId: req.userId! },
    orderBy: { sortOrder: "asc" },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });
  res.json(goals);
});

const createGoalSchema = z.object({
  cycleId: z.string().min(1),
  title: z.string().min(1),
  why: z.string().optional(),
  visualization: z.string().optional(),
  specification: z.string().min(1),
  targetDate: z.string().min(1),
});

router.post("/", async (req, res) => {
  const parsed = createGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const cycle = await prisma.cycle.findFirst({ where: { id: parsed.data.cycleId, userId: req.userId! } });
  if (!cycle) {
    res.status(400).json({ error: "Ciclo no encontrado" });
    return;
  }

  let targetDate: Date;
  try {
    targetDate = parseDateOnlyToUtcMidnight(parsed.data.targetDate);
  } catch {
    res.status(400).json({ error: "Fecha límite inválida, se espera YYYY-MM-DD" });
    return;
  }

  const last = await prisma.goal.findFirst({
    where: { cycleId: parsed.data.cycleId, userId: req.userId! },
    orderBy: { sortOrder: "desc" },
  });

  const goal = await prisma.goal.create({
    data: {
      cycleId: parsed.data.cycleId,
      userId: req.userId!,
      title: parsed.data.title,
      why: parsed.data.why,
      visualization: parsed.data.visualization,
      specification: parsed.data.specification,
      targetDate,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
    include: { steps: true },
  });
  res.status(201).json(goal);
});

const updateGoalSchema = z
  .object({
    title: z.string().min(1),
    why: z.string(),
    visualization: z.string(),
    specification: z.string().min(1),
    targetDate: z.string().min(1),
    status: goalStatusSchema,
    followUpNotes: z.string(),
    celebration: z.string(),
  })
  .partial();

router.patch("/:id", async (req, res) => {
  const parsed = updateGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) {
    res.status(404).json({ error: "Meta no encontrada" });
    return;
  }

  const { targetDate, ...rest } = parsed.data;
  let parsedTargetDate: Date | undefined;
  if (targetDate !== undefined) {
    try {
      parsedTargetDate = parseDateOnlyToUtcMidnight(targetDate);
    } catch {
      res.status(400).json({ error: "Fecha límite inválida, se espera YYYY-MM-DD" });
      return;
    }
  }

  const goal = await prisma.goal.update({
    where: { id: existing.id },
    data: { ...rest, ...(parsedTargetDate ? { targetDate: parsedTargetDate } : {}) },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });
  res.json(goal);
});

router.delete("/:id", async (req, res) => {
  const goal = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!goal) {
    res.status(404).json({ error: "Meta no encontrada" });
    return;
  }

  // Igual que DELETE /habits/:id y /cycles/:id: borrar la meta se lleva sus
  // pasos (decisión explícita, no default de Prisma — la relación no tiene
  // onDelete: Cascade en el schema).
  await prisma.$transaction([
    prisma.goalStep.deleteMany({ where: { goalId: goal.id } }),
    prisma.goal.delete({ where: { id: goal.id } }),
  ]);

  res.status(204).send();
});

const createStepSchema = z.object({ description: z.string().min(1) });

router.post("/:id/steps", async (req, res) => {
  const parsed = createStepSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const goal = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!goal) {
    res.status(404).json({ error: "Meta no encontrada" });
    return;
  }

  const last = await prisma.goalStep.findFirst({
    where: { goalId: goal.id },
    orderBy: { sortOrder: "desc" },
  });

  const step = await prisma.goalStep.create({
    data: { goalId: goal.id, description: parsed.data.description, sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  res.status(201).json(step);
});

const updateStepSchema = z.object({ description: z.string().min(1), done: z.boolean() }).partial();

// GoalStep no tiene `userId` propio (ver comentario en schema.prisma): el
// dueño se verifica a través de su Goal, por eso estas dos rutas primero
// buscan el paso filtrando por `goal: { userId }` antes de tocarlo — recién
// ahí se sabe que es seguro mutarlo/borrarlo por su `id` solo.
router.patch("/:id/steps/:stepId", async (req, res) => {
  const parsed = updateStepSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.goalStep.findFirst({
    where: { id: req.params.stepId, goalId: req.params.id, goal: { userId: req.userId! } },
  });
  if (!existing) {
    res.status(404).json({ error: "Paso no encontrado" });
    return;
  }

  const step = await prisma.goalStep.update({ where: { id: existing.id }, data: parsed.data });
  res.json(step);
});

router.delete("/:id/steps/:stepId", async (req, res) => {
  const existing = await prisma.goalStep.findFirst({
    where: { id: req.params.stepId, goalId: req.params.id, goal: { userId: req.userId! } },
  });
  if (!existing) {
    res.status(404).json({ error: "Paso no encontrado" });
    return;
  }

  await prisma.goalStep.delete({ where: { id: existing.id } });
  res.status(204).send();
});

export default router;
