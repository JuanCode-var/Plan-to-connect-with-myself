import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { parseDateOnlyToUtcMidnight, todayLocalISO } from "../date-utils";
import { applicationTypeSchema } from "../domain";

const router = Router();

function addDaysToISO(dateISO: string, days: number): string {
  const d = parseDateOnlyToUtcMidnight(dateISO);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// GET /learning-applications/summary — "Esta semana" (Paso 3, franja debajo
// de la tarjeta de Hoy): aplicaciones por día de la SEMANA CALENDARIO (lunes
// a domingo) que contiene hoy — no los últimos 7 días rodantes, los 7
// círculos del mockup están etiquetados L a D. `byDay` trae los 7 días del
// lunes al domingo, aunque sean futuros (en 0) — el cliente decide cómo
// dibujar un día que todavía no llegó. Ruta literal antes de "/:id" (no
// existe esa ruta hoy, pero por las dudas si se agrega más adelante).
router.get("/summary", async (req, res) => {
  const today = todayLocalISO();
  const todayDate = parseDateOnlyToUtcMidnight(today);
  const weekdayMondayFirst = (todayDate.getUTCDay() + 6) % 7; // 0=lunes..6=domingo
  const monday = addDaysToISO(today, -weekdayMondayFirst);
  const sunday = addDaysToISO(monday, 6);

  const applications = await prisma.learningApplication.findMany({
    where: { userId: req.userId!, date: { gte: parseDateOnlyToUtcMidnight(monday), lte: parseDateOnlyToUtcMidnight(sunday) } },
    select: { date: true },
  });

  const byDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) byDay[addDaysToISO(monday, i)] = 0;
  for (const a of applications) {
    const iso = a.date.toISOString().slice(0, 10);
    if (iso in byDay) byDay[iso] += 1;
  }

  res.json({ weekStart: monday, total: applications.length, byDay });
});

// "Cómo lo apliqué": el diario, más reciente primero. `?learningId=` lo
// acota a un solo aprendizaje (pestaña "Cómo lo apliqué" de Aprendizajes,
// Paso 4) — sin él, trae todo (uso genérico, sin consumidor hoy).
router.get("/", async (req, res) => {
  const learningId = typeof req.query.learningId === "string" ? req.query.learningId : undefined;
  const applications = await prisma.learningApplication.findMany({
    where: { userId: req.userId!, ...(learningId ? { learningId } : {}) },
    orderBy: { date: "desc" },
    include: {
      habit: { select: { id: true, name: true } },
      learning: { select: { id: true, title: true, area: true } },
    },
  });
  res.json(applications);
});

const createApplicationSchema = z.object({
  // Opcional desde el rediseño de Micro acciones (Paso 1): una reflexión
  // puede nacer de completar una MicroAction en "Hoy" (sin hábito disparador
  // — ver POST /micro-actions/:id/complete-with-reflection, que es el
  // camino nuevo para ESE caso) o seguir naciendo de marcar un hábito
  // cumplido (ApplyLearningModal.tsx), que sí manda habitId.
  habitId: z.string().min(1).optional(),
  context: z.string().min(1).optional(),
  learningId: z.string().min(1),
  type: applicationTypeSchema,
  response: z.string().min(1),
});

router.post("/", async (req, res) => {
  const parsed = createApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Nunca confiar un FK ajeno solo porque el body lo trae — mismo criterio
  // que assertOwnIdentity en routes/habits.ts.
  const [habit, learning] = await Promise.all([
    parsed.data.habitId ? prisma.habit.findFirst({ where: { id: parsed.data.habitId, userId: req.userId! } }) : null,
    prisma.learning.findFirst({ where: { id: parsed.data.learningId, userId: req.userId! } }),
  ]);
  if ((parsed.data.habitId && !habit) || !learning) {
    res.status(400).json({ error: "Hábito o aprendizaje no encontrado" });
    return;
  }

  const today = todayLocalISO();
  const application = await prisma.learningApplication.create({
    data: {
      userId: req.userId!,
      habitId: parsed.data.habitId ?? null,
      context: parsed.data.context ?? null,
      learningId: parsed.data.learningId,
      type: parsed.data.type,
      response: parsed.data.response,
      date: parseDateOnlyToUtcMidnight(today),
    },
  });

  res.status(201).json(application);
});

export default router;
