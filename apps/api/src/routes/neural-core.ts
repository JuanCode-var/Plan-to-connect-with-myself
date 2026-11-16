import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";

const router = Router();

const BRAIN_AREAS = ["men", "emo", "fis", "esp", "eco", "hab"] as const;
const CORE_STATES = ["latente", "despertar", "enfoque", "flow", "pleno"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function dateOnlyISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Lee los impulsos de por vida (por área) y el historial diario del Núcleo
// Neural — antes vivían solo en localStorage del dispositivo, ver
// apps/web/src/components/NeuralCore/brainHistory.ts.
router.get("/", async (req, res) => {
  const [areaStats, dailyStates] = await Promise.all([
    prisma.neuralAreaStat.findMany({ where: { userId: req.userId! } }),
    prisma.neuralDailyState.findMany({
      where: { userId: req.userId! },
      orderBy: { date: "desc" },
      take: 60,
    }),
  ]);
  res.json({ areaStats, dailyStates });
});

const adjustSchema = z.object({
  area: z.enum(BRAIN_AREAS),
  // Positivo al marcar un hábito (k impulsos de esa prioridad), negativo al
  // desmarcar — un solo endpoint para ambos casos.
  delta: z.number().int(),
  // SIEMPRE la manda el cliente, calendario LOCAL del usuario (ver
  // todayISO() en apps/web/src/lib/date.ts) — el server nunca asume "hoy"
  // por su cuenta, mismo criterio que Cycle/HabitLog en el resto de la API.
  date: z.string().regex(DATE_RE, "Se espera YYYY-MM-DD"),
  coreState: z.enum(CORE_STATES),
  totalImpulsesToday: z.number().int().min(0),
});

/**
 * Aplica un ajuste de impulsos a un área: suma/resta `delta` a
 * `impulsosDeVida` (nunca baja de 0), actualiza `activeDays`/
 * `lastImpulseDate` SOLO cuando `delta > 0` (desmarcar no revierte días
 * activos — mismo criterio que el motor del cliente, useBrainImpulseEngine.ts),
 * y deja el registro del día (`NeuralDailyState`) en el estado/conteo que
 * manda el cliente. Transacción porque el nuevo valor de `impulsosDeVida`
 * depende de leer el actual primero (no es un `increment` atómico puro, por
 * el piso en 0).
 */
router.post("/adjust", async (req, res) => {
  const parsed = adjustSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { area, delta, date, coreState, totalImpulsesToday } = parsed.data;
  const userId = req.userId!;
  const dateValue = new Date(date);

  const areaStat = await prisma.$transaction(async (tx) => {
    const existing = await tx.neuralAreaStat.findUnique({ where: { userId_area: { userId, area } } });
    const nextImpulsos = Math.max(0, (existing?.impulsosDeVida ?? 0) + delta);
    const isNewActiveDay = delta > 0 && (!existing?.lastImpulseDate || dateOnlyISO(existing.lastImpulseDate) !== date);
    const nextActiveDays = (existing?.activeDays ?? 0) + (isNewActiveDay ? 1 : 0);
    const nextLastImpulseDate = delta > 0 ? dateValue : (existing?.lastImpulseDate ?? null);

    const stat = await tx.neuralAreaStat.upsert({
      where: { userId_area: { userId, area } },
      create: {
        userId,
        area,
        impulsosDeVida: nextImpulsos,
        activeDays: nextActiveDays,
        lastImpulseDate: nextLastImpulseDate,
      },
      update: {
        impulsosDeVida: nextImpulsos,
        activeDays: nextActiveDays,
        lastImpulseDate: nextLastImpulseDate,
      },
    });

    await tx.neuralDailyState.upsert({
      where: { userId_date: { userId, date: dateValue } },
      create: { userId, date: dateValue, coreState, impulses: totalImpulsesToday },
      update: { coreState, impulses: totalImpulsesToday },
    });

    return stat;
  });

  res.json(areaStat);
});

export default router;
