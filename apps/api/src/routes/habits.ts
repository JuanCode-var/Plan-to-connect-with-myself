import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { habitCategorySchema, habitMomentSchema, habitPrioritySchema } from "../domain";

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
  priority: habitPrioritySchema,
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

const reorderHabitsSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

// PUT /api/habits/reorder — nuevo orden (dentro de un mismo momento del
// día, ver Habits.tsx) de los hábitos listados en `ids`. En vez de
// renumerar TODO sortOrder (que es un contador global, no por momento, ver
// POST / más arriba), se toman los valores de sortOrder que esos mismos
// hábitos ya tenían, se ordenan ascendente y se reasignan según la posición
// nueva — así ningún otro hábito (de otro momento) se ve afectado. Ruta
// literal antes de "/:id" para que no choque con esa.
router.put("/reorder", async (req, res) => {
  const parsed = reorderHabitsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { ids } = parsed.data;
  const habits = await prisma.habit.findMany({ where: { id: { in: ids } } });
  if (habits.length !== ids.length) {
    res.status(400).json({ error: "Alguno de los hábitos no existe" });
    return;
  }

  const sortedValues = habits.map((h) => h.sortOrder).sort((a, b) => a - b);
  await prisma.$transaction(
    ids.map((id, i) => prisma.habit.update({ where: { id }, data: { sortOrder: sortedValues[i] } })),
  );

  res.status(204).send();
});

const updateHabitSchema = z
  .object({
    name: z.string().min(1),
    moment: habitMomentSchema,
    specification: z.string().min(1),
    category: habitCategorySchema,
    priority: habitPrioritySchema,
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

router.delete("/:id", async (req, res) => {
  const habit = await prisma.habit.findUnique({ where: { id: req.params.id } });
  if (!habit) {
    res.status(404).json({ error: "Hábito no encontrado" });
    return;
  }

  // Igual que DELETE /cycles/:id: borrar el hábito se lleva sus HabitLog
  // (decisión explícita, no default de Prisma — la relación no tiene
  // onDelete: Cascade en el schema).
  await prisma.$transaction([
    prisma.habitLog.deleteMany({ where: { habitId: habit.id } }),
    prisma.habit.delete({ where: { id: habit.id } }),
  ]);

  res.status(204).send();
});

export default router;
