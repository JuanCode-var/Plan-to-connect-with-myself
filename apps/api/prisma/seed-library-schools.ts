import type { PrismaClient } from "@prisma/client";

/**
 * Escuelas de filosofía — lista inicial editable (no hay nada de esto
 * hardcodeado fuera de esta tabla; para agregar/renombrar una escuela,
 * alcanza con tocar `LibrarySchool` directo). El texto de los 7 días de
 * cada reto arranca VACÍO a propósito (ver LibrarySchoolChallengeDay en
 * schema.prisma) — contenido filosófico real para que el usuario lo
 * escriba, nunca inventado acá.
 */
export const SEED_SCHOOLS: Array<{ name: string; area: string | null; sortOrder: number }> = [
  { name: "Estoicismo", area: null, sortOrder: 1 },
  { name: "Nietzsche", area: null, sortOrder: 2 },
  { name: "Programación mental", area: null, sortOrder: 3 },
  { name: "Idealismo práctico", area: null, sortOrder: 4 },
];

const CHALLENGE_DAYS = 7;

/** Idempotente (mismo criterio que seedLibrary/seedDoses): si ya hay alguna escuela cargada, no vuelve a insertar. */
export async function seedLibrarySchools(prisma: PrismaClient): Promise<void> {
  const alreadySeeded = await prisma.librarySchool.count();
  if (alreadySeeded > 0) return;

  for (const school of SEED_SCHOOLS) {
    const created = await prisma.librarySchool.create({ data: school });
    await prisma.librarySchoolChallengeDay.createMany({
      data: Array.from({ length: CHALLENGE_DAYS }, (_, i) => ({ schoolId: created.id, day: i + 1, text: "" })),
    });
  }
}
