import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";

const router = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/doses — todas las dosis activas, con su fuente (libro o escuela)
// — alimenta tanto el selector de "la dosis de hoy" (Fase 1) como el
// reproductor de 5 pasos (Fase 2). Contenido curado por archivo de seed
// (ver apps/api/prisma/seed-doses.ts), no hay POST/PUT todavía — se agrega
// cuando haga falta editar dosis desde la app, no antes.
router.get("/", async (_req, res) => {
  const doses = await prisma.dose.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      sourceEntry: { select: { id: true, title: true, author: true } },
      sourceSchool: { select: { id: true, name: true } },
      rewardEntry: { select: { id: true, content: true, author: true } },
    },
  });
  res.json(doses);
});

// GET /api/doses/progress — todas las dosis que ESTE usuario completó
// alguna vez (log completo, no solo la última — ver comentario en
// DoseProgress, schema.prisma: hace falta el historial para la racha y
// para reciclar la vista hace más tiempo).
router.get("/progress", async (req, res) => {
  const progress = await prisma.doseProgress.findMany({
    where: { userId: req.userId! },
    orderBy: { completedAt: "desc" },
  });
  res.json(progress);
});

// POST /api/doses/:id/unlock-reward — paso 4 ("TU RECOMPENSA"), al voltear
// la carta. Idempotente (upsert): volver a llamarlo (recargar la página a
// mitad del paso, reciclar la misma dosis más adelante) nunca duplica la
// fila ni rompe — UnlockedQuote tiene @@unique([userId, entryId]).
router.post("/:id/unlock-reward", async (req, res) => {
  const dose = await prisma.dose.findUnique({ where: { id: req.params.id } });
  if (!dose) {
    res.status(404).json({ error: "Dosis no encontrada" });
    return;
  }

  await prisma.unlockedQuote.upsert({
    where: { userId_entryId: { userId: req.userId!, entryId: dose.rewardEntryId } },
    create: { userId: req.userId!, entryId: dose.rewardEntryId },
    update: {},
  });

  const [unlockedCount, totalQuotes] = await Promise.all([
    prisma.unlockedQuote.count({ where: { userId: req.userId! } }),
    prisma.libraryEntry.count({ where: { section: "FRASE" } }),
  ]);
  res.json({ entryId: dose.rewardEntryId, unlockedCount, totalQuotes });
});

const completeDoseSchema = z.object({
  actionIndex: z.number().int().min(0).max(2),
  // Calendario LOCAL del usuario (mismo criterio que POST /neural-core/adjust
  // — el server nunca asume "hoy" por su cuenta).
  date: z.string().regex(DATE_RE, "Se espera YYYY-MM-DD"),
});

const LEARNING_TITLE_PREFIX = "Alimento para tu cerebro";

// POST /api/doses/:id/complete — paso 5 ("HOY LO PRUEBO"): crea la micro
// acción elegida (de las 3 de `actionsJson`, por índice — el texto sale del
// lado del server, nunca se confía en texto arbitrario del cliente) y
// registra que la dosis se completó hoy (DoseProgress, para la racha y para
// no repetirla hasta agotar su área — ver doseSelector.ts). El impulso en
// sí lo manda el cliente por separado a POST /neural-core/adjust (mismo
// mecanismo que ya usa el resto de la app — ver useSendDoseImpulse.ts), acá
// no se duplica esa lógica.
router.post("/:id/complete", async (req, res) => {
  const dose = await prisma.dose.findUnique({ where: { id: req.params.id } });
  if (!dose) {
    res.status(404).json({ error: "Dosis no encontrada" });
    return;
  }

  const parsed = completeDoseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  let actions: Array<{ text: string; detail: string }>;
  try {
    actions = JSON.parse(dose.actionsJson);
  } catch {
    actions = [];
  }
  const action = actions[parsed.data.actionIndex];
  if (!action) {
    res.status(400).json({ error: "Acción inválida para esta dosis" });
    return;
  }

  const learningTitle = `${LEARNING_TITLE_PREFIX} · ${dose.area}`;
  let learning = await prisma.learning.findFirst({ where: { userId: req.userId!, title: learningTitle, area: dose.area } });
  if (!learning) {
    learning = await prisma.learning.create({
      data: { userId: req.userId!, title: learningTitle, area: dose.area, source: "Alimento para tu cerebro (Biblioteca)" },
    });
  }

  const [microAction] = await prisma.$transaction([
    prisma.microAction.create({
      data: {
        userId: req.userId!,
        learningId: learning.id,
        text: action.text,
        date: new Date(`${parsed.data.date}T00:00:00.000Z`),
        origin: "MANUAL",
      },
    }),
    prisma.doseProgress.create({ data: { userId: req.userId!, doseId: dose.id, date: parsed.data.date } }),
  ]);

  res.status(201).json({ microAction });
});

export default router;
