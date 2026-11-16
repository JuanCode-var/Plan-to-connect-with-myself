import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { HABIT_CATEGORIES } from "../domain";

const router = Router();

/**
 * "Versiones de ti" (Resonancia del ciclo): intención de la próxima versión
 * ("¿qué región quieres encender?", tarjeta "EN DISEÑO"). Vive en `User`
 * (perfil, no en un ciclo puntual) porque lo que importa es "qué eligió la
 * próxima vez que entre", no un dato histórico de este ciclo — ver comentario
 * en schema.prisma.
 */
router.get("/next-cycle-focus", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { nextCycleFocusArea: true, nextCycleFocusSetInCycleId: true },
  });
  res.json({ area: user?.nextCycleFocusArea ?? null, setInCycleId: user?.nextCycleFocusSetInCycleId ?? null });
});

const setNextCycleFocusSchema = z.object({
  area: z.enum(HABIT_CATEGORIES).nullable(),
  cycleId: z.string().min(1).nullable(),
});

/**
 * `area: null` también sirve para LIMPIAR la intención (al mostrarla al
 * empezar el siguiente ciclo, ver Dashboard.tsx — de un solo uso). `cycleId`
 * es el ciclo que estaba ACTIVO cuando se eligió: así el frontend sabe
 * cuándo "ya cambió de ciclo" y es momento de mostrarla.
 */
router.put("/next-cycle-focus", async (req, res) => {
  const parsed = setNextCycleFocusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (parsed.data.area) {
    const cycle = await prisma.cycle.findFirst({ where: { id: parsed.data.cycleId ?? undefined, userId: req.userId! } });
    if (!cycle) {
      res.status(400).json({ error: "Ciclo no encontrado" });
      return;
    }
  }

  await prisma.user.update({
    where: { id: req.userId! },
    data: { nextCycleFocusArea: parsed.data.area, nextCycleFocusSetInCycleId: parsed.data.area ? parsed.data.cycleId : null },
  });
  res.json({ area: parsed.data.area, setInCycleId: parsed.data.area ? parsed.data.cycleId : null });
});

export default router;
