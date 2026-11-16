import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { parseDateOnlyToUtcMidnight, todayLocalISO } from "../date-utils";
import { microActionOriginSchema } from "../domain";
import { connectionLevelFor } from "../lib/connectionLevel";

const router = Router();

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Se espera YYYY-MM-DD");

function addDaysToISO(dateISO: string, days: number): string {
  const d = parseDateOnlyToUtcMidnight(dateISO);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// `?learningId=` trae TODAS las micro acciones de ese aprendizaje, sin
// filtrar por fecha — es lo que arma el checklist de "x/y" en LearningCard
// (progreso acumulado de ese aprendizaje, no de un día puntual). Sin eso,
// `?date=` (o HOY si tampoco viene) trae las de ese día — mismo default que
// el resto de la app (ver `today` en TrackerMatrix.tsx/TodayProgress.tsx).
router.get("/", async (req, res) => {
  const learningId = typeof req.query.learningId === "string" ? req.query.learningId : undefined;

  let where: { userId: string; learningId: string } | { userId: string; date: Date; isLikelyNote: boolean };
  if (learningId) {
    // Trae todo, notas incluidas — la pestaña "Micro acciones" de
    // Aprendizajes necesita verlas para que el usuario las pueda "Ordenar".
    where = { userId: req.userId!, learningId };
  } else {
    const parsedDate = dateOnly.safeParse(req.query.date ?? todayLocalISO());
    if (!parsedDate.success) {
      res.status(400).json({ error: parsedDate.error.flatten() });
      return;
    }
    // "Hoy" (Paso 3) nunca muestra una nota como si fuera un paso para
    // marcar — isLikelyNote=false acá, a diferencia de arriba.
    where = { userId: req.userId!, date: parseDateOnlyToUtcMidnight(parsedDate.data), isLikelyNote: false };
  }

  const microActions = await prisma.microAction.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { learning: { select: { id: true, title: true, area: true } } },
  });
  res.json(microActions);
});

// Progreso de hoy (para la tarjeta "3/5 micro acciones logradas hoy") +
// semana (últimos 7 días, hoy incluido, para "14 de 22 · 64%").
router.get("/summary", async (req, res) => {
  const today = todayLocalISO();
  const weekStart = addDaysToISO(today, -6);

  const [todayActions, weekActions] = await Promise.all([
    prisma.microAction.findMany({
      where: { userId: req.userId!, date: parseDateOnlyToUtcMidnight(today) },
      select: { completed: true },
    }),
    prisma.microAction.findMany({
      where: {
        userId: req.userId!,
        date: { gte: parseDateOnlyToUtcMidnight(weekStart), lte: parseDateOnlyToUtcMidnight(today) },
      },
      select: { completed: true },
    }),
  ]);

  res.json({
    today: { completed: todayActions.filter((a) => a.completed).length, total: todayActions.length },
    week: { completed: weekActions.filter((a) => a.completed).length, total: weekActions.length },
  });
});

const createMicroActionSchema = z.object({
  learningId: z.string().min(1),
  text: z.string().min(1),
  date: dateOnly.optional(),
  origin: microActionOriginSchema.optional(),
});

router.post("/", async (req, res) => {
  const parsed = createMicroActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const learning = await prisma.learning.findFirst({ where: { id: parsed.data.learningId, userId: req.userId! } });
  if (!learning) {
    res.status(400).json({ error: "Aprendizaje no encontrado" });
    return;
  }

  const microAction = await prisma.microAction.create({
    data: {
      userId: req.userId!,
      learningId: parsed.data.learningId,
      text: parsed.data.text,
      date: parseDateOnlyToUtcMidnight(parsed.data.date ?? todayLocalISO()),
      origin: parsed.data.origin ?? "MANUAL",
    },
  });
  res.status(201).json(microAction);
});

const updateMicroActionSchema = z
  .object({
    text: z.string().min(1),
    date: dateOnly,
    completed: z.boolean(),
  })
  .partial();

router.patch("/:id", async (req, res) => {
  const parsed = updateMicroActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.microAction.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) {
    res.status(404).json({ error: "Micro acción no encontrada" });
    return;
  }

  const { date, completed, ...rest } = parsed.data;
  const microAction = await prisma.microAction.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...(date !== undefined ? { date: parseDateOnlyToUtcMidnight(date) } : {}),
      ...(completed !== undefined ? { completed, completedAt: completed ? new Date() : null } : {}),
    },
  });
  res.json(microAction);
});

const completeWithReflectionSchema = z.object({ text: z.string().min(1), context: z.string().min(1).optional() });

// POST /micro-actions/:id/complete-with-reflection — "Hoy" (Paso 3): marcar
// una micro acción hecha Y guardar, en el mismo paso, "¿qué aprendiste al
// hacerlo?" como una Application real vinculada a esta misma MicroAction
// (nunca al revés — ver comentario de LearningApplication.microActionId en
// schema.prisma, esa dirección invertida era la causa de las duplicadas).
router.post("/:id/complete-with-reflection", async (req, res) => {
  const parsed = completeWithReflectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.microAction.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) {
    res.status(404).json({ error: "Micro acción no encontrada" });
    return;
  }
  if (!existing.learningId) {
    res.status(400).json({ error: "Esta micro acción no está vinculada a un aprendizaje" });
    return;
  }

  const now = new Date();
  const [microAction, application] = await prisma.$transaction([
    prisma.microAction.update({ where: { id: existing.id }, data: { completed: true, completedAt: now } }),
    prisma.learningApplication.create({
      data: {
        userId: req.userId!,
        learningId: existing.learningId,
        context: parsed.data.context ?? null,
        type: "APPLIED",
        response: parsed.data.text,
        date: parseDateOnlyToUtcMidnight(todayLocalISO()),
        microActionId: existing.id,
      },
    }),
  ]);

  const applicationsCount = await prisma.learningApplication.count({ where: { learningId: existing.learningId } });
  res.status(201).json({ microAction, application, level: connectionLevelFor(applicationsCount) });
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.microAction.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) {
    res.status(404).json({ error: "Micro acción no encontrada" });
    return;
  }

  await prisma.microAction.delete({ where: { id: existing.id } });
  res.status(204).send();
});

export default router;
