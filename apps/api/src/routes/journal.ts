import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { parseDateOnlyToUtcMidnight } from "../date-utils";
import { emotionSchema } from "../domain";

const router = Router();

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Se espera YYYY-MM-DD");

// `kind` separa las 4 secciones del diario: "emotion" son los check-ins
// (tienen `emotion`), "knowledge" son las reflexiones sueltas del día,
// "gratitude" lo que la persona agradece ese día, "flow" los minutos en
// estado de flow (ver comentarios en schema.prisma). Se filtra por el campo
// propio de cada sección, no por "emotion IS NULL", porque ninguna de las
// otras tres tiene emoción y esa regla ya no alcanzaría para distinguirlas
// entre sí. Sin `kind` trae todo.
const querySchema = z.object({
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  emotion: emotionSchema.optional(),
  kind: z.enum(["emotion", "knowledge", "gratitude", "flow"]).optional(),
});

const KIND_FIELD = {
  emotion: "emotion",
  knowledge: "knowledge",
  gratitude: "gratitude",
  flow: "flowMinutes",
} as const;

router.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { from, to, emotion, kind } = parsed.data;
  // `emotion` (filtro puntual) manda sobre `kind` si ambos llegan: pedir una
  // emoción específica ya implica kind "emotion".
  const kindFilter = kind && !emotion ? { [KIND_FIELD[kind]]: { not: null } } : {};
  const entries = await prisma.emotionalEntry.findMany({
    where: {
      userId: req.userId!,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: parseDateOnlyToUtcMidnight(from) } : {}),
              ...(to ? { lte: parseDateOnlyToUtcMidnight(to) } : {}),
            },
          }
        : {}),
      ...(emotion ? { emotion } : {}),
      ...kindFilter,
    },
    orderBy: { date: "desc" },
  });
  res.json(entries);
});

// emotion es opcional: una entrada puede ser un check-in emocional (con
// emoción), una entrada de "Conocimientos y reflexiones" (solo `knowledge`),
// una de "Gratitud" (solo `gratitude`) o una de "Flow" (solo `flowMinutes`,
// con `flowActivity` opcional). El refine exige una de las cuatro, nunca un
// registro vacío.
const createEntrySchema = z
  .object({
    date: dateOnly,
    emotion: emotionSchema.optional(),
    // 1-10, solo tiene sentido junto a `emotion` (ver Paso 2 del rediseño).
    intensity: z.number().int().min(1).max(10).optional(),
    situation: z.string().min(1).optional(),
    feeling: z.string().min(1).optional(),
    impulse: z.string().min(1).optional(),
    decision: z.string().min(1).optional(),
    learning: z.string().min(1).optional(),
    knowledge: z.string().min(1).optional(),
    // Libro/Podcast/Conversación/Experiencia/Biblioteca, u otro texto libre
    // — solo tiene sentido junto a `knowledge`.
    source: z.string().min(1).optional(),
    // Id del Learning ya creado en Micro acciones cuando "Llevarlo a la
    // acción" estaba activo (el cliente crea el Learning primero y lo manda
    // acá) — ver comentario en schema.prisma.
    learningId: z.string().min(1).optional(),
    gratitude: z.string().min(1).optional(),
    flowMinutes: z.number().int().positive().optional(),
    flowActivity: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      data.emotion !== undefined ||
      data.knowledge !== undefined ||
      data.gratitude !== undefined ||
      data.flowMinutes !== undefined,
    {
      message: "Se espera una emoción (check-in emocional), un conocimiento (reflexión), algo que agradezcas o minutos en flow",
    },
  );

router.post("/", async (req, res) => {
  const parsed = createEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const entry = await prisma.emotionalEntry.create({
    data: { ...parsed.data, date: parseDateOnlyToUtcMidnight(parsed.data.date), userId: req.userId! },
  });
  res.status(201).json(entry);
});

function toDateOnlyISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysToISO(dateISO: string, days: number): string {
  const d = parseDateOnlyToUtcMidnight(dateISO);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateOnlyISO(d);
}

const gratitudeSchema = z.object({
  date: dateOnly,
  // "Tres cosas que agradeces hoy" (Paso 4): hasta 3 líneas, al menos 1 no
  // vacía — cada una se guarda como su propia fila de EmotionalEntry (mismo
  // criterio que ya permite varios registros de "flow" el mismo día: acá
  // tampoco hay un límite de "una fila por fecha").
  items: z.array(z.string()).min(1).max(3),
});

// POST /api/journal/gratitude — a diferencia del POST genérico de arriba,
// esta ruta propia existe porque guardar gratitud tiene un efecto secundario
// real (Paso 4 del pedido): si existe un hábito propio cuyo nombre contiene
// "agradec" o "gratitud" (case-insensitive — ej. "Escribir 3 cosas por las
// que me encuentro agradecido"), se marca DONE para esa fecha y se devuelve
// su racha actual, para el mensaje de confirmación dorado. Sin ese hábito,
// solo se guardan las entradas.
router.post("/gratitude", async (req, res) => {
  const parsed = gratitudeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const userId = req.userId!;
  const texts = parsed.data.items.map((t) => t.trim()).filter(Boolean);
  if (texts.length === 0) {
    res.status(400).json({ error: "Se espera al menos una línea de gratitud" });
    return;
  }

  const date = parseDateOnlyToUtcMidnight(parsed.data.date);
  const entries = await prisma.$transaction(
    texts.map((gratitude) => prisma.emotionalEntry.create({ data: { date, gratitude, userId } })),
  );

  const habit = await prisma.habit.findFirst({
    where: { userId, active: true, OR: [{ name: { contains: "agradec" } }, { name: { contains: "gratitud" } }] },
  });

  let habitMarked: { habitId: string; name: string; streak: number } | null = null;
  if (habit) {
    const cycle = await prisma.cycle.findFirst({ where: { userId, startDate: { lte: date }, endDate: { gte: date } } });
    if (cycle) {
      await prisma.habitLog.upsert({
        where: { habitId_date: { habitId: habit.id, date } },
        update: { status: "DONE", cycleId: cycle.id },
        create: { habitId: habit.id, date, cycleId: cycle.id, status: "DONE" },
      });

      // Racha actual: mismo criterio que GET /habits/identity-stats — días
      // consecutivos (calendario, sin huecos) en DONE, contando hacia atrás
      // desde la fila DONE más reciente.
      const doneLogs = await prisma.habitLog.findMany({
        where: { habitId: habit.id, status: "DONE" },
        orderBy: { date: "desc" },
        select: { date: true },
      });
      let streak = 0;
      let cursor: string | null = null;
      for (const log of doneLogs) {
        const dateISO = toDateOnlyISO(log.date);
        if (cursor === null || dateISO === addDaysToISO(cursor, -1)) {
          streak += 1;
          cursor = dateISO;
        } else {
          break;
        }
      }

      habitMarked = { habitId: habit.id, name: habit.name, streak };
    }
  }

  res.status(201).json({ entries, habitMarked });
});

export default router;
