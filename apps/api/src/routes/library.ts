import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { librarySectionSchema, pinDurationSchema, type PinDuration } from "../domain";

const router = Router();

// GET /api/library[?section=LIBRO|FRASE|FILOSOFIA] — semilla curada
// (compartida entre TODAS las cuentas, `userId` NULL) + las propias de quien
// pide (fuente "mixta", ver seed-library-data.ts). Sin filtro devuelve las 3
// secciones: la Biblioteca las agrupa en el cliente.
router.get("/", async (req, res) => {
  const sectionFilter = librarySectionSchema.safeParse(req.query.section);
  const entries = await prisma.libraryEntry.findMany({
    where: {
      OR: [{ userId: null }, { userId: req.userId! }],
      ...(sectionFilter.success ? { section: sectionFilter.data } : {}),
    },
    orderBy: [{ source: "asc" }, { createdAt: "asc" }],
  });
  res.json(entries);
});

// GET /api/library/pinned — la frase anclada vigente para /tracker, o `null`
// si no hay ninguna o ya venció. Ruta literal antes de `/:id` para que no
// choque con esa, y con `pinnedUntil` en el futuro (en vez de solo "no nulo")
// para que una frase vencida deje de mostrarse sin tener que desanclarla a mano.
router.get("/pinned", async (_req, res) => {
  const entry = await prisma.libraryEntry.findFirst({
    where: { pinnedUntil: { gt: new Date() } },
    orderBy: { pinnedUntil: "desc" },
  });
  res.json(entry ?? null);
});

const createLibraryEntrySchema = z.object({
  section: librarySectionSchema,
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  content: z.string().min(1),
});

router.post("/", async (req, res) => {
  const parsed = createLibraryEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const entry = await prisma.libraryEntry.create({
    data: { ...parsed.data, source: "USER", userId: req.userId! },
  });
  res.status(201).json(entry);
});

router.delete("/:id", async (req, res) => {
  const entry = await prisma.libraryEntry.findUnique({ where: { id: req.params.id } });
  if (!entry) {
    res.status(404).json({ error: "Entrada no encontrada" });
    return;
  }
  // El contenido curado (SEED) no se puede borrar desde la app: es la
  // biblioteca base, igual que los 12 hábitos semilla no se reordenan.
  if (entry.source === "SEED") {
    res.status(403).json({ error: "No se puede eliminar contenido curado de la biblioteca" });
    return;
  }
  // No es de quien pide: ni se confirma que existe (404 genérico, igual que
  // si de verdad no existiera) ni se borra.
  if (entry.userId !== req.userId) {
    res.status(404).json({ error: "Entrada no encontrada" });
    return;
  }

  await prisma.libraryEntry.delete({ where: { id: entry.id } });
  res.status(204).send();
});

const PIN_DURATION_MS: Record<PinDuration, number> = {
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
};

const pinEntrySchema = z.object({ duration: pinDurationSchema });

// POST /api/library/:id/pin — ancla esta frase en /tracker por la duración
// elegida. Solo una entrada puede estar anclada a la vez: se limpia el
// pinnedUntil de cualquier otra antes de fijar la nueva (ver comentario en
// schema.prisma). A diferencia del resto de este archivo, pin/unpin quedan
// SIN filtrar por `userId` a propósito: es un detalle de ambientación
// compartida (la frase que se ve hoy en /tracker), no un dato privado.
router.post("/:id/pin", async (req, res) => {
  const entry = await prisma.libraryEntry.findUnique({ where: { id: req.params.id } });
  if (!entry) {
    res.status(404).json({ error: "Entrada no encontrada" });
    return;
  }

  const parsed = pinEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const pinnedUntil = new Date(Date.now() + PIN_DURATION_MS[parsed.data.duration]);

  const [, updated] = await prisma.$transaction([
    prisma.libraryEntry.updateMany({
      where: { id: { not: entry.id }, pinnedUntil: { not: null } },
      data: { pinnedUntil: null },
    }),
    prisma.libraryEntry.update({ where: { id: entry.id }, data: { pinnedUntil } }),
  ]);

  res.json(updated);
});

// GET /api/library/schools — las escuelas de filosofía con sus 7 días de
// reto y el avance de ESTE usuario en cada una (ver SchoolChallengeProgress
// en schema.prisma) — currentDay: 0 si todavía no hay fila de avance.
router.get("/schools", async (req, res) => {
  const [schools, progress] = await Promise.all([
    prisma.librarySchool.findMany({
      orderBy: { sortOrder: "asc" },
      include: { challengeDays: { orderBy: { day: "asc" } }, _count: { select: { entries: true } } },
    }),
    prisma.schoolChallengeProgress.findMany({ where: { userId: req.userId! } }),
  ]);
  const progressBySchool = new Map(progress.map((p) => [p.schoolId, p]));
  res.json(
    schools.map((s) => ({
      id: s.id,
      name: s.name,
      area: s.area,
      entryCount: s._count.entries,
      challengeDays: s.challengeDays,
      currentDay: progressBySchool.get(s.id)?.currentDay ?? 0,
    })),
  );
});

// POST /api/library/schools/:id/advance-day — marca el día de hoy del reto
// como hecho (currentDay += 1, tope 7). Ruta literal antes de `/:id` del
// resto de este archivo, mismo criterio que `/pinned`. `startedAt` se fija
// al pasar de 0 a 1, `completedAt` al llegar a 7 — ninguno se vuelve a
// tocar si se llama de nuevo ya en 7 (idempotente en el tope).
router.post("/schools/:id/advance-day", async (req, res) => {
  const school = await prisma.librarySchool.findUnique({ where: { id: req.params.id } });
  if (!school) {
    res.status(404).json({ error: "Escuela no encontrada" });
    return;
  }

  const existing = await prisma.schoolChallengeProgress.findUnique({
    where: { userId_schoolId: { userId: req.userId!, schoolId: school.id } },
  });
  const currentDay = existing?.currentDay ?? 0;
  if (currentDay >= 7) {
    res.json(existing);
    return;
  }

  const nextDay = currentDay + 1;
  const now = new Date();
  const progress = await prisma.schoolChallengeProgress.upsert({
    where: { userId_schoolId: { userId: req.userId!, schoolId: school.id } },
    create: { userId: req.userId!, schoolId: school.id, currentDay: 1, startedAt: now, completedAt: nextDay === 7 ? now : null },
    update: { currentDay: nextDay, completedAt: nextDay === 7 ? now : undefined },
  });
  res.json(progress);
});

// GET /api/library/reading-progress — avance de lectura de ESTE usuario,
// por libro (tab/idea actual, %, estado) — ver BookReadingProgress.
router.get("/reading-progress", async (req, res) => {
  const progress = await prisma.bookReadingProgress.findMany({ where: { userId: req.userId! } });
  res.json(progress);
});

const bookReadingTabSchema = z.enum(["IDEA", "IDEAS", "RESUMEN"]);
const bookStatusSchema = z.enum(["NUEVO", "EN_PROGRESO", "LEIDO"]);

const updateReadingProgressSchema = z.object({
  tab: bookReadingTabSchema.optional(),
  currentIdeaIndex: z.number().int().min(0).max(4).optional(),
  percent: z.number().int().min(0).max(100).optional(),
  status: bookStatusSchema.optional(),
});

// PUT /api/library/:id/reading-progress — guarda en qué pestaña/idea se
// quedó y, opcionalmente, el estado (NUEVO/EN_PROGRESO/LEIDO). `startedAt`
// se fija la primera vez que se guarda algo (upsert), `finishedAt` cuando
// el estado pasa a LEIDO — ninguno de los dos se vuelve a tocar después.
router.put("/:id/reading-progress", async (req, res) => {
  const entry = await prisma.libraryEntry.findFirst({
    where: { id: req.params.id, OR: [{ userId: null }, { userId: req.userId! }] },
  });
  if (!entry) {
    res.status(404).json({ error: "Entrada no encontrada" });
    return;
  }

  const parsed = updateReadingProgressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const now = new Date();
  const existing = await prisma.bookReadingProgress.findUnique({
    where: { userId_entryId: { userId: req.userId!, entryId: entry.id } },
  });
  const becomesRead = parsed.data.status === "LEIDO" && existing?.status !== "LEIDO";

  const progress = await prisma.bookReadingProgress.upsert({
    where: { userId_entryId: { userId: req.userId!, entryId: entry.id } },
    create: { userId: req.userId!, entryId: entry.id, ...parsed.data, startedAt: now, finishedAt: becomesRead ? now : null },
    update: { ...parsed.data, ...(becomesRead ? { finishedAt: now } : {}) },
  });
  res.json(progress);
});

// GET /api/library/unlocked-quotes — ids de las FRASE que ESTE usuario ya
// desbloqueó completando dosis (ver UnlockedQuote) — arrancan todas
// bloqueadas, sin excepción (decisión explícita, ver comentario en
// schema.prisma).
router.get("/unlocked-quotes", async (req, res) => {
  const unlocked = await prisma.unlockedQuote.findMany({ where: { userId: req.userId! } });
  res.json(unlocked);
});

router.post("/:id/unpin", async (req, res) => {
  try {
    const entry = await prisma.libraryEntry.update({
      where: { id: req.params.id },
      data: { pinnedUntil: null },
    });
    res.json(entry);
  } catch {
    res.status(404).json({ error: "Entrada no encontrada" });
  }
});

export default router;
