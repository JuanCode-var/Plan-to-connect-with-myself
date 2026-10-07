import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { librarySectionSchema, pinDurationSchema, type PinDuration } from "../domain";

const router = Router();

// GET /api/library[?section=LIBRO|FRASE|FILOSOFIA] — semilla curada + las
// propias del usuario juntas (fuente "mixta", ver seed-library-data.ts). Sin
// filtro devuelve las 3 secciones: la Biblioteca las agrupa en el cliente.
router.get("/", async (req, res) => {
  const sectionFilter = librarySectionSchema.safeParse(req.query.section);
  const entries = await prisma.libraryEntry.findMany({
    where: sectionFilter.success ? { section: sectionFilter.data } : undefined,
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
    data: { ...parsed.data, source: "USER" },
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
// schema.prisma).
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
