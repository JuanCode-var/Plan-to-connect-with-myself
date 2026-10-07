import { Router } from "express";
import { prisma } from "../db";
import { computeInsights } from "../services/insights";

const router = Router();

// GET /api/insights — patrones detectados sobre TODA la historia (no un
// ciclo puntual): incluye hábitos pausados y ciclos viejos a propósito, el
// patrón puede ser justamente la razón por la que algo se pausó.
router.get("/", async (_req, res) => {
  const [habits, logs, entries] = await Promise.all([
    prisma.habit.findMany({ select: { id: true, name: true, createdAt: true } }),
    prisma.habitLog.findMany({ select: { habitId: true, date: true, status: true } }),
    prisma.emotionalEntry.findMany({
      where: { emotion: { not: null } },
      select: { date: true, emotion: true },
    }),
  ]);

  res.json(computeInsights(habits, logs, entries));
});

export default router;
