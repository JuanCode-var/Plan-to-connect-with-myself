import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { habitCategorySchema } from "../domain";
import { connectionLevelFor } from "../lib/connectionLevel";
import { toDateOnlyISO } from "../services/tracking";

const router = Router();

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Por defecto solo los activos (igual criterio que GET /habits, que por
// defecto trae solo `active: true`) — `?includeArchived=true` trae todos,
// usado por la grilla de edición si hiciera falta en el futuro. Cada
// aprendizaje trae su nivel de conexión (Paso 1) y se ordena por actividad
// reciente (pedido explícito, no por fecha de creación) — "actividad" es la
// fecha más nueva entre sus Applications y MicroActions, o su propia
// createdAt si todavía no tiene ninguna.
router.get("/", async (req, res) => {
  const includeArchived = req.query.includeArchived === "true";
  const learnings = await prisma.learning.findMany({
    where: { userId: req.userId!, ...(includeArchived ? {} : { archived: false }) },
    include: {
      applications: { select: { date: true } },
      microActions: { select: { date: true, completed: true, isLikelyNote: true } },
    },
  });

  const withStats = learnings.map((l) => {
    const applicationsCount = l.applications.length;
    const activityDates = [
      l.createdAt.getTime(),
      ...l.applications.map((a) => a.date.getTime()),
      ...l.microActions.map((m) => m.date.getTime()),
    ];
    const lastActivityAt = new Date(Math.max(...activityDates));
    const { applications, microActions, ...rest } = l;
    return {
      ...rest,
      applicationsCount,
      level: connectionLevelFor(applicationsCount),
      lastActivityAt,
    };
  });

  withStats.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
  res.json(withStats);
});

// Si viene `habitId`, confirma que ese Habit pertenezca al usuario antes de
// guardar — mismo criterio que assertOwnIdentity en routes/habits.ts: nunca
// confiar un FK ajeno solo porque el body lo trae.
async function assertOwnHabit(habitId: string | null | undefined, userId: string): Promise<boolean> {
  if (!habitId) return true;
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  return !!habit;
}

const BIBLIOTECA_SOURCE_PREFIX = "Alimento para tu cerebro";

// "LA IDEA" (Paso 4): si el aprendizaje no tiene `keyIdea` propio y viene de
// una dosis de la Biblioteca (ver doses.ts, que SIEMPRE crea el Learning sin
// keyIdea), se usa la explicación real de la dosis más reciente de esa área
// — nunca un texto inventado. `null` si no hay ninguna dosis completada
// todavía para esa área (estado vacío honesto, no un texto de relleno).
async function derivedIdeaFor(learning: { userId: string; area: string; keyIdea: string | null; source: string | null }) {
  if (learning.keyIdea || !learning.source?.startsWith(BIBLIOTECA_SOURCE_PREFIX)) return null;

  const progress = await prisma.doseProgress.findMany({
    where: { userId: learning.userId },
    orderBy: { completedAt: "desc" },
    include: { dose: { select: { area: true, guessExplanation: true } } },
  });
  const match = progress.find((p) => p.dose.area === learning.area);
  if (!match) return null;

  return { text: match.dose.guessExplanation, label: "resumen de tu dosis del día en la Biblioteca" };
}

// El "dato motivador" (Paso 4) — siempre calculado a partir de datos reales
// del propio usuario, nunca inventado. Prioridad: 1) es la conexión más
// fuerte de TODAS (más aplicaciones, con al menos 1); 2) es la que más se
// practicó ESTA semana; 3) tiene micro acciones hechas pero ninguna
// aplicación registrada todavía; si nada de eso aplica, no hay insight (se
// omite la línea en vez de forzar un texto genérico).
async function insightFor(
  learning: { id: string; userId: string },
  applicationsCount: number,
  applicationDates: Date[],
  microActionsCompletedCount: number,
  microActionsTotalCount: number,
) {
  const allLearnings = await prisma.learning.findMany({
    where: { userId: learning.userId },
    select: { id: true, applications: { select: { date: true } } },
  });

  let strongestId: string | null = null;
  let strongestCount = 0;
  const weekStart = new Date();
  weekStart.setUTCHours(0, 0, 0, 0);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  let weekLeaderId: string | null = null;
  let weekLeaderCount = 0;
  let thisLearningWeekCount = 0;
  let thisLearningWeekDates: Date[] = [];

  for (const l of allLearnings) {
    const count = l.applications.length;
    if (count > strongestCount) {
      strongestCount = count;
      strongestId = l.id;
    }
    const weekDates = l.applications.map((a) => a.date).filter((d) => d.getTime() >= weekStart.getTime());
    if (weekDates.length > weekLeaderCount) {
      weekLeaderCount = weekDates.length;
      weekLeaderId = l.id;
    }
    if (l.id === learning.id) {
      thisLearningWeekCount = weekDates.length;
      thisLearningWeekDates = weekDates;
    }
  }

  function daySpan(dates: Date[]): number {
    if (dates.length === 0) return 0;
    const times = dates.map((d) => d.getTime());
    return Math.round((Math.max(...times) - Math.min(...times)) / 86_400_000) + 1;
  }

  if (applicationsCount > 0 && learning.id === strongestId && strongestCount === applicationsCount) {
    const days = daySpan(applicationDates);
    return `Lo aplicaste ${applicationsCount} ${applicationsCount === 1 ? "vez" : "veces"} en ${days} ${days === 1 ? "día" : "días"}. Es tu conexión más fuerte: este aprendizaje ya forma parte de cómo piensas.`;
  }
  if (thisLearningWeekCount > 0 && learning.id === weekLeaderId && weekLeaderCount === thisLearningWeekCount) {
    const days = daySpan(thisLearningWeekDates);
    return `Lo aplicaste ${thisLearningWeekCount} ${thisLearningWeekCount === 1 ? "vez" : "veces"} en ${days} ${days === 1 ? "día" : "días"}. Es el aprendizaje que más estás practicando esta semana.`;
  }
  if (applicationsCount === 0 && microActionsCompletedCount > 0) {
    return `Hiciste ${microActionsCompletedCount} de sus ${microActionsTotalCount} micro acciones, pero todavía no registraste qué aprendiste al hacerla${microActionsCompletedCount === 1 ? "" : "s"}. Ese registro es lo que enciende la conexión.`;
  }
  return null;
}

// GET /learnings/:id/detail — todo lo que necesita el panel de detalle de
// "Aprendizajes" (Paso 4) en un solo viaje: LA IDEA (propia o derivada de la
// Biblioteca), el dato motivador, y los contadores de duplicadas/notas para
// el aviso de "Ordenar" (ver POST /:id/order más abajo).
router.get("/:id/detail", async (req, res) => {
  const learning = await prisma.learning.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!learning) {
    res.status(404).json({ error: "Aprendizaje no encontrado" });
    return;
  }

  const [applications, microActions] = await Promise.all([
    prisma.learningApplication.findMany({ where: { learningId: learning.id }, select: { date: true } }),
    prisma.microAction.findMany({ where: { learningId: learning.id } }),
  ]);

  const applicationsCount = applications.length;
  const microActionsCompletedCount = microActions.filter((m) => m.completed).length;
  const [derivedIdea, insight] = await Promise.all([
    derivedIdeaFor(learning),
    insightFor(learning, applicationsCount, applications.map((a) => a.date), microActionsCompletedCount, microActions.length),
  ]);

  // Duplicadas: mismo texto normalizado entre MicroAction de este
  // aprendizaje (sin contar las ya marcadas como nota). Notas: isLikelyNote.
  const notes = microActions.filter((m) => m.isLikelyNote);
  const actionable = microActions.filter((m) => !m.isLikelyNote);
  const groups = new Map<string, number>();
  for (const m of actionable) {
    const key = normalizeText(m.text);
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  let duplicateGroups = 0;
  let duplicateExtras = 0;
  for (const count of groups.values()) {
    if (count > 1) {
      duplicateGroups += 1;
      duplicateExtras += count - 1;
    }
  }

  res.json({
    ...learning,
    applicationsCount,
    level: connectionLevelFor(applicationsCount),
    derivedIdea,
    insight,
    microActionsCount: microActions.length,
    duplicateGroups,
    duplicateExtras,
    notesCount: notes.length,
  });
});

// POST /learnings/:id/order — "Ordenar" (Paso 4): unifica las micro
// acciones repetidas (se queda con la que está hecha, o si ninguna lo está,
// con la más vieja) y convierte cada nota (isLikelyNote) en una Application
// real — nunca al revés, y nunca borra contenido: el texto de la nota pasa
// tal cual a `response`.
router.post("/:id/order", async (req, res) => {
  const learning = await prisma.learning.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!learning) {
    res.status(404).json({ error: "Aprendizaje no encontrado" });
    return;
  }

  const microActions = await prisma.microAction.findMany({ where: { learningId: learning.id }, orderBy: { createdAt: "asc" } });
  const notes = microActions.filter((m) => m.isLikelyNote);
  const actionable = microActions.filter((m) => !m.isLikelyNote);

  const groups = new Map<string, typeof actionable>();
  for (const m of actionable) {
    const key = normalizeText(m.text);
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }

  const idsToDelete: string[] = [];
  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    const keep = group.find((m) => m.completed) ?? group[0];
    for (const m of group) {
      if (m.id !== keep.id) idsToDelete.push(m.id);
    }
  }

  const today = toDateOnlyISO(new Date());
  await prisma.$transaction([
    ...(idsToDelete.length > 0 ? [prisma.microAction.deleteMany({ where: { id: { in: idsToDelete } } })] : []),
    ...notes.map((n) =>
      prisma.learningApplication.create({
        data: {
          userId: req.userId!,
          learningId: learning.id,
          type: "APPLIED",
          response: n.text,
          date: new Date(`${today}T00:00:00.000Z`),
        },
      }),
    ),
    ...(notes.length > 0 ? [prisma.microAction.deleteMany({ where: { id: { in: notes.map((n) => n.id) } } })] : []),
  ]);

  res.json({ mergedDuplicates: idsToDelete.length, convertedNotes: notes.length });
});

const createLearningSchema = z.object({
  title: z.string().min(1),
  keyIdea: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  area: habitCategorySchema,
  // Vínculo opcional a un hábito elegido a mano (ver GET /suggested/:habitId
  // más abajo) — "" del selector "Sin asociar" se normaliza a null.
  habitId: z.string().min(1).nullable().optional(),
});

router.post("/", async (req, res) => {
  const parsed = createLearningSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!(await assertOwnHabit(parsed.data.habitId, req.userId!))) {
    res.status(400).json({ error: "Hábito no encontrado" });
    return;
  }

  const learning = await prisma.learning.create({ data: { ...parsed.data, userId: req.userId! } });
  res.status(201).json(learning);
});

const updateLearningSchema = z
  .object({
    title: z.string().min(1),
    keyIdea: z.string().nullable(),
    source: z.string().nullable(),
    area: habitCategorySchema,
    archived: z.boolean(),
    habitId: z.string().min(1).nullable(),
  })
  .partial();

router.patch("/:id", async (req, res) => {
  const parsed = updateLearningSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.learning.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) {
    res.status(404).json({ error: "Aprendizaje no encontrado" });
    return;
  }

  if (!(await assertOwnHabit(parsed.data.habitId, req.userId!))) {
    res.status(400).json({ error: "Hábito no encontrado" });
    return;
  }

  const learning = await prisma.learning.update({ where: { id: existing.id }, data: parsed.data });
  res.json(learning);
});

router.delete("/:id", async (req, res) => {
  const learning = await prisma.learning.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!learning) {
    res.status(404).json({ error: "Aprendizaje no encontrado" });
    return;
  }

  // Igual que DELETE /habits/:id: se lleva sus MicroAction y
  // LearningApplication (decisión explícita, no default de Prisma — las
  // relaciones no tienen onDelete: Cascade en el schema).
  await prisma.$transaction([
    prisma.microAction.deleteMany({ where: { learningId: learning.id } }),
    prisma.learningApplication.deleteMany({ where: { learningId: learning.id } }),
    prisma.learning.delete({ where: { id: learning.id } }),
  ]);

  res.status(204).send();
});

// GET /learnings/suggested/:habitId — el aprendizaje que ofrece el cuadro
// de "¿cómo lo aplicaste?" al marcar cumplido un hábito. Prioridad: 1) el
// aprendizaje vinculado A MANO a ESTE hábito (cualquier categoría — ver
// Learning.habitId); si no hay ninguno, 2) el comportamiento de siempre,
// restringido por el frontend a hábitos Mental/Emocional (TrackerMatrix.tsx):
// el más reciente de la MISMA área que el hábito, o si no hay ninguno de esa
// área, el más reciente en general; si no hay ninguno, `null`. Las dos
// últimas excluyen a cualquier aprendizaje vinculado A MANO a OTRO hábito
// (LearningForm.tsx: "Asociar con hábito" promete que ESE vínculo sea
// exclusivo) — solo entran a competir los que no tienen habitId o lo tienen
// apuntando a este mismo hábito.
router.get("/suggested/:habitId", async (req, res) => {
  const habit = await prisma.habit.findFirst({ where: { id: req.params.habitId, userId: req.userId! } });
  if (!habit) {
    res.status(404).json({ error: "Hábito no encontrado" });
    return;
  }

  const linked = await prisma.learning.findFirst({
    where: { userId: req.userId!, archived: false, habitId: habit.id },
    orderBy: { createdAt: "desc" },
  });
  if (linked) {
    res.json(linked);
    return;
  }

  const notLinkedToOtherHabit = { OR: [{ habitId: null }, { habitId: habit.id }] };

  const sameArea = await prisma.learning.findFirst({
    where: { userId: req.userId!, archived: false, area: habit.category, ...notLinkedToOtherHabit },
    orderBy: { createdAt: "desc" },
  });
  if (sameArea) {
    res.json(sameArea);
    return;
  }

  const anyArea = await prisma.learning.findFirst({
    where: { userId: req.userId!, archived: false, ...notLinkedToOtherHabit },
    orderBy: { createdAt: "desc" },
  });
  res.json(anyArea ?? null);
});

export default router;
