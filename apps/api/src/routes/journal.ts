import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { parseDateOnlyToUtcMidnight } from "../date-utils";
import { emotionSchema } from "../domain";

const router = Router();

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Se espera YYYY-MM-DD");

const querySchema = z.object({
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  emotion: emotionSchema.optional(),
});

router.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { from, to, emotion } = parsed.data;
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
    },
    orderBy: { date: "desc" },
  });
  res.json(entries);
});

const createEntrySchema = z.object({
  date: dateOnly,
  emotion: emotionSchema,
  situation: z.string().min(1).optional(),
  feeling: z.string().min(1).optional(),
  impulse: z.string().min(1).optional(),
  decision: z.string().min(1).optional(),
  learning: z.string().min(1).optional(),
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
