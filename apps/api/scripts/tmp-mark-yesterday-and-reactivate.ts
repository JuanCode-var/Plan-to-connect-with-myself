import { prisma } from "../src/db";

const REACTIVATE_HABIT_ID = "cmuxmatqb0004ewsaydxvjjxz"; // Compromiso, disciplina y proposito...

const YESTERDAY = new Date("2026-11-03T00:00:00.000Z");

const EXCLUDED_NAMES = new Set([
  "Levantarme a las 6:30 de la mañana.",
  "Tomar creatina",
  "Tomar la melatonina",
  "Cero alcohol",
]);

async function main() {
  const user = await prisma.user.findFirst({ where: { email: "manuel-torres34@hotmail.com" } });
  if (!user) throw new Error("No se encontró el usuario");

  // --- Reactivar el hábito de cierre del día ---
  const habitToReactivate = await prisma.habit.findFirst({ where: { id: REACTIVATE_HABIT_ID, userId: user.id } });
  if (!habitToReactivate) throw new Error("No se encontró el hábito a reactivar. Abortando sin tocar nada.");

  // --- Hábitos activos de ayer a marcar DONE (todos menos los excluidos) ---
  const activeHabits = await prisma.habit.findMany({ where: { userId: user.id, active: true } });
  const toMark = activeHabits.filter((h) => !EXCLUDED_NAMES.has(h.name));
  const expectedCount = activeHabits.length - EXCLUDED_NAMES.size;
  if (toMark.length !== expectedCount) {
    throw new Error(
      `Se esperaban ${expectedCount} hábitos a marcar (${activeHabits.length} activos - ${EXCLUDED_NAMES.size} excluidos), pero el filtro dio ${toMark.length}. Revisar nombres exactos. Abortando sin tocar nada.`,
    );
  }

  // --- Ciclo que cubre el 2026-11-03 (mismo criterio que PUT /api/logs/:habitId/:date) ---
  const cycle = await prisma.cycle.findFirst({
    where: { userId: user.id, startDate: { lte: YESTERDAY }, endDate: { gte: YESTERDAY } },
  });
  if (!cycle) throw new Error("Ningún ciclo cubre el 2026-11-03. Abortando sin tocar nada.");

  console.log("=== Se va a hacer ===");
  console.log(`- Reactivar: "${habitToReactivate.name}" (active: ${habitToReactivate.active} -> true)`);
  console.log(`- Marcar DONE el 2026-11-03 (ciclo "${cycle.name}") en ${toMark.length} hábito(s):`);
  for (const h of toMark) console.log(`    "${h.name}"`);
  console.log(`- Quedan sin tocar (PENDING): ${[...EXCLUDED_NAMES].join(", ")}`);
  console.log("");

  await prisma.$transaction(async (tx) => {
    await tx.habit.update({ where: { id: habitToReactivate.id }, data: { active: true } });

    for (const h of toMark) {
      await tx.habitLog.upsert({
        where: { habitId_date: { habitId: h.id, date: YESTERDAY } },
        update: { status: "DONE", cycleId: cycle.id },
        create: { habitId: h.id, date: YESTERDAY, cycleId: cycle.id, status: "DONE" },
      });
    }
  });

  console.log("Listo.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
