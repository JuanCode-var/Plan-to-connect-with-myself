import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { parseDateOnlyToUtcMidnight } from "../date-utils";
import { goalStatusSchema } from "../domain";

const router = Router();

// GET /api/goals?cycleId=... — metas de un ciclo, con sus pasos ya
// incluidos (evita un segundo viaje por cada tarjeta en /metas).
router.get("/", async (req, res) => {
  const cycleId = typeof req.query.cycleId === "string" ? req.query.cycleId : undefined;
  if (!cycleId) {
    res.status(400).json({ error: "Falta cycleId" });
    return;
  }

  const goals = await prisma.goal.findMany({
    where: { cycleId },
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

  const cycle = await prisma.cycle.findUnique({ where: { id: parsed.data.cycleId } });
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
    where: { cycleId: parsed.data.cycleId },
    orderBy: { sortOrder: "desc" },
  });

  const goal = await prisma.goal.create({
    data: {
      cycleId: parsed.data.cycleId,
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

  try {
    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: { ...rest, ...(parsedTargetDate ? { targetDate: parsedTargetDate } : {}) },
      include: { steps: { orderBy: { sortOrder: "asc" } } },
    });
    res.json(goal);
  } catch {
    res.status(404).json({ error: "Meta no encontrada" });
  }
});

router.delete("/:id", async (req, res) => {
  const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
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

  const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
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

router.patch("/:id/steps/:stepId", async (req, res) => {
  const parsed = updateStepSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const step = await prisma.goalStep.update({
      where: { id: req.params.stepId },
      data: parsed.data,
    });
    res.json(step);
  } catch {
    res.status(404).json({ error: "Paso no encontrado" });
  }
});

router.delete("/:id/steps/:stepId", async (req, res) => {
  try {
    await prisma.goalStep.delete({ where: { id: req.params.stepId } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Paso no encontrado" });
  }
});

export default router;
