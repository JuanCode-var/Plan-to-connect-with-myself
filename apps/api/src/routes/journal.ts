import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { parseDateOnlyToUtcMidnight } from "../date-utils";
import { emotionSchema } from "../domain";

const router = Router();

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Se espera YYYY-MM-DD");

// `kind` separa las 3 secciones del diario: "emotion" son los check-ins
// (tienen `emotion`), "knowledge" son las reflexiones sueltas del día,
// "gratitude" lo que la persona agradece ese día (ver comentarios en
// schema.prisma). Se filtra por el campo propio de cada sección, no por
// "emotion IS NULL", porque tanto knowledge como gratitude carecen de
// emoción y esa regla ya no alcanzaría para distinguirlas entre sí. Sin
// `kind` trae todo.
const querySchema = z.object({
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  emotion: emotionSchema.optional(),
  kind: z.enum(["emotion", "knowledge", "gratitude"]).optional(),
});

const KIND_FIELD = {
  emotion: "emotion",
  knowledge: "knowledge",
  gratitude: "gratitude",
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
// emoción), una entrada de "Conocimientos y reflexiones" (solo `knowledge`)
// o una entrada de "Gratitud" (solo `gratitude`). El refine exige que sea
// una de las tres, nunca un registro vacío.
const createEntrySchema = z
  .object({
    date: dateOnly,
    emotion: emotionSchema.optional(),
    situation: z.string().min(1).optional(),
    feeling: z.string().min(1).optional(),
    impulse: z.string().min(1).optional(),
    decision: z.string().min(1).optional(),
    learning: z.string().min(1).optional(),
    knowledge: z.string().min(1).optional(),
    gratitude: z.string().min(1).optional(),
  })
  .refine((data) => data.emotion !== undefined || data.knowledge !== undefined || data.gratitude !== undefined, {
    message: "Se espera una emoción (check-in emocional), un conocimiento (reflexión) o algo que agradezcas",
  });

router.post("/", async (req, res) => {
  const parsed = createEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const entry = await prisma.emotionalEntry.create({
    data: { ...parsed.data, date: parseDateOnlyToUtcMidnight(parsed.data.date) },
  });
  res.status(201).json(entry);
});

export default router;
