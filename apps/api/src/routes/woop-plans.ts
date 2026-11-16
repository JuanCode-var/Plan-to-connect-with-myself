import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { todayLocalISO } from "../date-utils";
import { toDateOnlyISO } from "../services/tracking";
import { habitCategorySchema } from "../domain";

const router = Router();

// Si viene `identityId`, confirma que esa Identity pertenezca al usuario (a
// través de su Compass) antes de guardar — mismo criterio que
// assertOwnIdentity en routes/habits.ts.
async function assertOwnIdentity(identityId: string | null | undefined, userId: string): Promise<boolean> {
  if (!identityId) return true;
  const identity = await prisma.identity.findFirst({ where: { id: identityId, compass: { userId } } });
  return !!identity;
}

router.get("/", async (req, res) => {
  const woopPlans = await prisma.woopPlan.findMany({
    where: { userId: req.userId!, active: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(woopPlans);
});

const createWoopPlanSchema = z.object({
  title: z.string().min(1).nullable().optional(),
  desire: z.string().min(1),
  result: z.string().min(1),
  obstacle: z.string().min(1),
  planIf: z.string().min(1),
  planThen: z.string().min(1),
  // "Hábitos por identidad": a qué área de vida pertenece este plan (ver
  // comentario en schema.prisma) — opcional para no romper llamadas viejas,
  // pero WoopFlow.tsx ya lo pide siempre en el asistente nuevo.
  area: habitCategorySchema.nullable().optional(),
  identityId: z.string().min(1).nullable().optional(),
  sourceInsightType: z.string().nullable().optional(),
  sourceInsightSummary: z.string().nullable().optional(),
  reminderWeekday: z.number().int().min(0).max(6).nullable().optional(),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Se espera HH:mm")
    .nullable()
    .optional(),
});

router.post("/", async (req, res) => {
  const parsed = createWoopPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!(await assertOwnIdentity(parsed.data.identityId, req.userId!))) {
    res.status(400).json({ error: "Identidad no encontrada" });
    return;
  }

  const woopPlan = await prisma.woopPlan.create({ data: { ...parsed.data, userId: req.userId! } });
  res.status(201).json(woopPlan);
});

const updateWoopPlanSchema = z
  .object({
    title: z.string().min(1).nullable(),
    desire: z.string().min(1),
    result: z.string().min(1),
    obstacle: z.string().min(1),
    planIf: z.string().min(1),
    planThen: z.string().min(1),
    area: habitCategorySchema.nullable(),
    reminderWeekday: z.number().int().min(0).max(6).nullable(),
    reminderTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Se espera HH:mm")
      .nullable(),
    active: z.boolean(),
  })
  .partial();

router.patch("/:id", async (req, res) => {
  const parsed = updateWoopPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.woopPlan.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) {
    res.status(404).json({ error: "Plan WOOP no encontrado" });
    return;
  }

  const woopPlan = await prisma.woopPlan.update({ where: { id: existing.id }, data: parsed.data });
  res.json(woopPlan);
});

const reportResultSchema = z.object({ worked: z.boolean() });

// "¿Usaste el plan hoy?" — alimenta "Usado N · funcionó M" de la tarjeta
// (ver WoopPlanCard.tsx). Solo una respuesta por día (pedido explícito,
// Paso 5): `lastResultDate` guarda la última fecha respondida, en
// comparación de fecha pura (nunca de hora) con el calendario LOCAL del
// usuario, mismo criterio que el resto de la app.
router.post("/:id/result", async (req, res) => {
  const parsed = reportResultSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.woopPlan.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) {
    res.status(404).json({ error: "Plan WOOP no encontrado" });
    return;
  }

  const today = todayLocalISO();
  if (existing.lastResultDate && toDateOnlyISO(existing.lastResultDate) === today) {
    res.status(409).json({ error: "Ya respondiste esto hoy" });
    return;
  }

  const woopPlan = await prisma.woopPlan.update({
    where: { id: existing.id },
    data: {
      timesUsed: { increment: 1 },
      lastResultDate: new Date(`${today}T00:00:00.000Z`),
      ...(parsed.data.worked ? { timesWorked: { increment: 1 } } : {}),
    },
  });
  res.json(woopPlan);
});

export default router;
