import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { librarySectionSchema } from "../domain";

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

export default router;
