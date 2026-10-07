import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { parseDateOnlyToUtcMidnight } from "../date-utils";
import { logStatusSchema } from "../domain";

const router = Router();

const paramsSchema = z.object({
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Se espera YYYY-MM-DD"),
});

const bodySchema = z.object({ status: logStatusSchema });

router.put("/:habitId/:date", async (req, res) => {
  const parsedParams = paramsSchema.safeParse(req.params);
  const parsedBody = bodySchema.safeParse(req.body);
  if (!parsedParams.success || !parsedBody.success) {
    res.status(400).json({
      error: {
        params: parsedParams.success ? undefined : parsedParams.error.flatten(),
        body: parsedBody.success ? undefined : parsedBody.error.flatten(),
      },
    });
    return;
  }

  const { habitId } = parsedParams.data;
  const date = parseDateOnlyToUtcMidnight(parsedParams.data.date);

  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId: req.userId! } });
  if (!habit) {
    res.status(404).json({ error: "Hábito no encontrado" });
    return;
  }

  // El log necesita cycleId: se busca el ciclo (propio) cuyo rango
  // [startDate, endDate] cubre la fecha recibida. Si ninguno la cubre, no
  // hay dónde persistir el estado (podría ser una fecha fuera de cualquier
  // ciclo creado).
  const cycle = await prisma.cycle.findFirst({
    where: { startDate: { lte: date }, endDate: { gte: date }, userId: req.userId! },
  });
  if (!cycle) {
    res.status(400).json({ error: "Ningún ciclo cubre esa fecha" });
    return;
  }

  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId, date } },
    update: { status: parsedBody.data.status, cycleId: cycle.id },
    create: { habitId, date, cycleId: cycle.id, status: parsedBody.data.status },
  });

  res.json(log);
});

export default router;
