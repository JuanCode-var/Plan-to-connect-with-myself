import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { habitCategorySchema, habitMomentSchema } from "../domain";

const router = Router();

router.get("/", async (_req, res) => {
  const habits = await prisma.habit.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  res.json(habits);
});

const createHabitSchema = z.object({
  name: z.string().min(1),
  moment: habitMomentSchema,
  specification: z.string().min(1),
  category: habitCategorySchema,
});

router.post("/", async (req, res) => {
  const parsed = createHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const last = await prisma.habit.findFirst({ orderBy: { sortOrder: "desc" } });
  const habit = await prisma.habit.create({
    data: { ...parsed.data, sortOrder: (last?.sortOrder ?? 0) + 1, active: true },
  });
  res.status(201).json(habit);
});

const updateHabitSchema = z
  .object({
    name: z.string().min(1),
    moment: habitMomentSchema,
    specification: z.string().min(1),
    category: habitCategorySchema,
    active: z.boolean(),
  })
  .partial();

router.patch("/:id", async (req, res) => {
  const parsed = updateHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const habit = await prisma.habit.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(habit);
  } catch {
    res.status(404).json({ error: "Hábito no encontrado" });
  }
});

export default router;
