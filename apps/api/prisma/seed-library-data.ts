import type { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

export type SeedLibraryEntry = {
  section: "LIBRO" | "FRASE" | "FILOSOFIA";
  title?: string;
  author?: string;
  content: string;
};

// El contenido real de la Biblioteca (libros, filosofías y frases que el
// usuario recopiló por su cuenta) vive en seed-library-personal.ts, que está
// en .gitignore a propósito: es contenido privado y nunca debe subirse al
// repositorio remoto. Si ese archivo no existe en esta máquina (clon nuevo,
// falta copiarlo, etc.) la Biblioteca simplemente arranca vacía en vez de
// romper el seed.
function loadPersonalEntries(): SeedLibraryEntry[] {
  const personalPath = path.join(__dirname, "seed-library-personal.ts");
  if (!fs.existsSync(personalPath)) return [];
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const personal = require("./seed-library-personal") as { PERSONAL_LIBRARY_ENTRIES?: SeedLibraryEntry[] };
  return personal.PERSONAL_LIBRARY_ENTRIES ?? [];
}

export const SEED_LIBRARY_ENTRIES: SeedLibraryEntry[] = loadPersonalEntries();

/**
 * Idempotente a propósito (a diferencia del seed de hábitos/ciclo): revisa
 * si ya hay entradas `source: "SEED"` antes de insertar, así se puede llamar
 * tanto desde seed.ts (reset completo) como ejecutar suelto en una base que
 * ya tiene datos de usuario, sin duplicar la biblioteca curada.
 */
export async function seedLibrary(prisma: PrismaClient): Promise<void> {
  const alreadySeeded = await prisma.libraryEntry.count({ where: { source: "SEED" } });
  if (alreadySeeded > 0) return;

  for (const entry of SEED_LIBRARY_ENTRIES) {
    await prisma.libraryEntry.create({ data: { ...entry, source: "SEED" } });
  }
}
