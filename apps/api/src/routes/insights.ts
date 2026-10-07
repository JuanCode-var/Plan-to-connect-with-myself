import { Router } from "express";
import { prisma } from "../db";
import { computeInsights } from "../services/insights";

const router = Router();

// GET /api/insights — patrones detectados sobre TODA la historia de esta
// cuenta (no un ciclo puntual): incluye hábitos pausados y ciclos viejos a
// propósito, el patrón puede ser justamente la razón por la que algo se
// pausó. HabitLog no tiene `userId` propio, así que se filtra a través de
// la relación con Habit (ver comentario en schema.prisma).
router.get("/", async (req, res) => {
  const [habits, logs, entries] = await Promise.all([
    prisma.habit.findMany({ where: { userId: req.userId! }, select: { id: true, name: true, createdAt: true } }),
    prisma.habitLog.findMany({
      where: { habit: { userId: req.userId! } },
      select: { habitId: true, date: true, status: true },
    }),
    prisma.emotionalEntry.findMany({
      where: { userId: req.userId!, emotion: { not: null } },
      select: { date: true, emotion: true },
    }),
  ]);

  res.json(computeInsights(habits, logs, entries));
});

export default router;
