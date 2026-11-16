import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { parseDateOnlyToUtcMidnight, todayLocalISO } from "../date-utils";
import { habitCategorySchema } from "../domain";
import { computeMonthStatus, deriveMonthSegments } from "../lib/wordMonths";

const router = Router();

// Rediseño "Metas del ciclo" (mockups 15-15f): de las 5 fases de Brian Tracy
// con checklist de pasos a un modelo de contador — "algo que puedas contar",
// nunca más de 3 por ciclo (pedido explícito, validado acá Y en el frontend).
const MAX_GOALS_PER_CYCLE = 3;

// GET /api/goals?cycleId=...
router.get("/", async (req, res) => {
  const cycleId = typeof req.query.cycleId === "string" ? req.query.cycleId : undefined;
  if (!cycleId) {
    res.status(400).json({ error: "Falta cycleId" });
    return;
  }

  const goals = await prisma.goal.findMany({
    where: { cycleId, userId: req.userId! },
    orderBy: { sortOrder: "asc" },
  });
  res.json(goals);
});

function trimToLength(text: string, maxLen: number): string {
  const trimmed = text.trim();
  return trimmed.length <= maxLen ? trimmed : `${trimmed.slice(0, maxLen).trim()}…`;
}

// GET /api/goals/ideas?cycleId=... — hasta 3 ideas de meta derivadas de datos
// reales (nunca inventadas, ver Paso 2 del pedido): un plan WOOP activo, el
// compromiso de Mi Palabra con el cierre más próximo, y la micro acción más
// repetida de este ciclo. Cada fuente aporta como mucho una idea; si una
// fuente no tiene datos reales que ofrecer, simplemente no aparece (nunca se
// rellena con una genérica). El frontend se encarga de ocultarlas cuando ya
// hay 3 metas o cuando el título coincide con una meta ya creada.
router.get("/ideas", async (req, res) => {
  const cycleId = typeof req.query.cycleId === "string" ? req.query.cycleId : undefined;
  if (!cycleId) {
    res.status(400).json({ error: "Falta cycleId" });
    return;
  }

  const cycle = await prisma.cycle.findFirst({ where: { id: cycleId, userId: req.userId! } });
  if (!cycle) {
    res.status(400).json({ error: "Ciclo no encontrado" });
    return;
  }

  type GoalIdea = {
    key: string;
    area: string | null;
    title: string;
    kind: "woop" | "word" | "microaction";
    closesOn: string | null;
  };
  const ideas: GoalIdea[] = [];

  // 1) El plan WOOP activo más reciente — WoopPlan no tiene un área propia
  // (ver schema.prisma), así que esta idea siempre viaja sin área; el paso 1
  // del asistente de creación la pide de todos modos.
  const woopPlan = await prisma.woopPlan.findFirst({
    where: { userId: req.userId!, active: true },
    orderBy: { createdAt: "desc" },
  });
  if (woopPlan) {
    ideas.push({
      key: `woop:${woopPlan.id}`,
      area: null,
      title: trimToLength(woopPlan.title ?? woopPlan.desire, 70),
      kind: "woop",
      closesOn: null,
    });
  }

  // 2) El compromiso de Mi Palabra cuyo tramo EN CURSO cierra más pronto —
  // solo entre los que ya tienen un área asignada (sin eso no hay color real
  // para el chip, y no se inventa uno). Mismos datos que ya expone GET
  // /word/commitments (sin PIN: el área y el título no son el contenido
  // protegido del compromiso).
  const vault = await prisma.wordVault.findUnique({
    where: { userId: req.userId! },
    include: { commitments: { include: { months: true } } },
  });
  const today = parseDateOnlyToUtcMidnight(todayLocalISO());
  let closestWord: { commitmentId: string; commitmentTitle: string; area: string; monthIndex: number; endDate: Date } | null = null;
  for (const commitment of vault?.commitments ?? []) {
    if (!commitment.area) continue;
    const segments = deriveMonthSegments(commitment.startDate, commitment.targetDate);
    const current = segments.find(
      (seg) => computeMonthStatus(seg, commitment.months.find((m) => m.monthIndex === seg.monthIndex), today) === "en_curso",
    );
    if (!current) continue;
    if (!closestWord || current.endDate.getTime() < closestWord.endDate.getTime()) {
      closestWord = { commitmentId: commitment.id, commitmentTitle: commitment.title, area: commitment.area, monthIndex: current.monthIndex, endDate: current.endDate };
    }
  }
  if (closestWord) {
    ideas.push({
      key: `word:${closestWord.commitmentId}:${closestWord.monthIndex}`,
      area: closestWord.area,
      title: `Sellar el mes ${closestWord.monthIndex} de ${closestWord.commitmentTitle}`,
      kind: "word",
      closesOn: closestWord.endDate.toISOString().slice(0, 10),
    });
  }

  // 3) La micro acción más repetida (completada) dentro de las fechas de
  // este ciclo — por debajo de 2 repeticiones no alcanza para sugerir "seguí
  // haciendo esto", así que esa fuente simplemente no aporta idea.
  const MIN_REPEAT_COUNT = 2;
  const grouped = await prisma.microAction.groupBy({
    by: ["learningId", "text"],
    where: {
      userId: req.userId!,
      completed: true,
      isLikelyNote: false,
      learningId: { not: null },
      date: { gte: cycle.startDate, lte: cycle.endDate },
    },
    _count: { _all: true },
  });
  const top = grouped.sort((a, b) => b._count._all - a._count._all)[0];
  if (top && top.learningId && top._count._all >= MIN_REPEAT_COUNT) {
    const learning = await prisma.learning.findUnique({ where: { id: top.learningId } });
    if (learning) {
      ideas.push({
        key: `microaction:${top.learningId}:${top.text}`,
        area: learning.area,
        title: `${top.text} ${top._count._all} días este ciclo`,
        kind: "microaction",
        closesOn: null,
      });
    }
  }

  res.json(ideas.slice(0, 3));
});

const createGoalSchema = z.object({
  cycleId: z.string().min(1),
  title: z.string().min(1),
  area: habitCategorySchema,
  why: z.string().optional(),
  visualization: z.string().optional(),
  targetCount: z.number().int().min(1),
  unit: z.string().min(1),
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

  const existingCount = await prisma.goal.count({ where: { cycleId: cycle.id, userId: req.userId! } });
  if (existingCount >= MAX_GOALS_PER_CYCLE) {
    res.status(400).json({ error: `Máximo ${MAX_GOALS_PER_CYCLE} metas por ciclo` });
    return;
  }

  let targetDate: Date;
  try {
    targetDate = parseDateOnlyToUtcMidnight(parsed.data.targetDate);
  } catch {
    res.status(400).json({ error: "Fecha límite inválida, se espera YYYY-MM-DD" });
    return;
  }
  if (targetDate.getTime() < cycle.startDate.getTime() || targetDate.getTime() > cycle.endDate.getTime()) {
    res.status(400).json({ error: "La fecha límite debe caer dentro del ciclo" });
    return;
  }

  const last = await prisma.goal.findFirst({
    where: { cycleId: cycle.id, userId: req.userId! },
    orderBy: { sortOrder: "desc" },
  });

  const goal = await prisma.goal.create({
    data: {
      cycleId: cycle.id,
      userId: req.userId!,
      title: parsed.data.title,
      area: parsed.data.area,
      why: parsed.data.why,
      visualization: parsed.data.visualization,
      targetCount: parsed.data.targetCount,
      unit: parsed.data.unit,
      targetDate,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });
  res.status(201).json(goal);
});

const updateGoalSchema = z
  .object({
    title: z.string().min(1),
    area: habitCategorySchema,
    why: z.string(),
    visualization: z.string(),
    targetCount: z.number().int().min(1),
    unit: z.string().min(1),
    targetDate: z.string().min(1),
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

  const { targetDate, targetCount, ...rest } = parsed.data;
  let parsedTargetDate: Date | undefined;
  if (targetDate !== undefined) {
    try {
      parsedTargetDate = parseDateOnlyToUtcMidnight(targetDate);
    } catch {
      res.status(400).json({ error: "Fecha límite inválida, se espera YYYY-MM-DD" });
      return;
    }
  }

  // Si se edita el objetivo, la meta puede cruzar el umbral de "lograda" sin
  // que `progress` cambie — se recalcula acá con el mismo criterio que POST
  // /:id/progress: nunca se pisa un `achievedAt` ya guardado mientras siga
  // lograda, y se limpia si deja de estarlo.
  const effectiveTargetCount = targetCount ?? existing.targetCount;
  const achievedAt = existing.progress >= effectiveTargetCount ? (existing.achievedAt ?? new Date()) : null;

  const goal = await prisma.goal.update({
    where: { id: existing.id },
    data: {
      ...rest,
      ...(targetCount !== undefined ? { targetCount } : {}),
      ...(parsedTargetDate ? { targetDate: parsedTargetDate } : {}),
      achievedAt,
    },
  });
  res.json(goal);
});

const progressSchema = z.object({ delta: z.union([z.literal(1), z.literal(-1)]) });

// POST /api/goals/:id/progress — "+1 · Registrar avance" y "Restar 1" del
// menú ⋯. El avance nunca baja de 0; lograda = progress >= targetCount,
// siempre recalculado acá (nunca se confía en el `achievedAt` previo).
router.post("/:id/progress", async (req, res) => {
  const parsed = progressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Pedido inválido" });
    return;
  }

  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) {
    res.status(404).json({ error: "Meta no encontrada" });
    return;
  }

  const progress = Math.max(0, existing.progress + parsed.data.delta);
  const achieved = progress >= existing.targetCount;
  const achievedAt = achieved ? (existing.achievedAt ?? new Date()) : null;

  const goal = await prisma.goal.update({ where: { id: existing.id }, data: { progress, achievedAt } });
  res.json(goal);
});

router.delete("/:id", async (req, res) => {
  const goal = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!goal) {
    res.status(404).json({ error: "Meta no encontrada" });
    return;
  }

  await prisma.goal.delete({ where: { id: goal.id } });
  res.status(204).send();
});

export default router;
