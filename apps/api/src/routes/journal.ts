import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { parseDateOnlyToUtcMidnight } from "../date-utils";
import { emotionSchema } from "../domain";

const router = Router();

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Se espera YYYY-MM-DD");

// `kind` separa las dos secciones del diario: "emotion" son los check-ins
// (tienen `emotion`), "knowledge" son las reflexiones sueltas del día (no
// tienen `emotion`, ver comentario en schema.prisma). Sin `kind` trae todo.
const querySchema = z.object({
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  emotion: emotionSchema.optional(),
  kind: z.enum(["emotion", "knowledge"]).optional(),
});

router.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { from, to, emotion, kind } = parsed.data;
  // `emotion` (filtro puntual) manda sobre `kind` si ambos llegan: pedir una
  // emoción específica ya implica kind "emotion".
  const emotionFilter = emotion ? emotion : kind === "emotion" ? { not: null } : kind === "knowledge" ? null : undefined;
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
      ...(emotionFilter !== undefined ? { emotion: emotionFilter } : {}),
    },
    orderBy: { date: "desc" },
  });
  res.json(entries);
});

// emotion es opcional: una entrada puede ser un check-in emocional (con
// emoción) o una entrada de solo "Conocimientos y reflexiones" (sin emoción,
// solo `knowledge`). El refine exige que sea una cosa o la otra, nunca un
// registro vacío.
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
  })
  .refine((data) => data.emotion !== undefined || data.knowledge !== undefined, {
    message: "Se espera una emoción (check-in emocional) o un conocimiento (reflexión del día)",
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
