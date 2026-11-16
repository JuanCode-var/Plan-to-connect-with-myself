import type { PrismaClient } from "@prisma/client";

/**
 * Carga de dosis — archivo de datos (no un panel de administrador, pedido
 * explícito ofrecía los dos: esto es más simple y consistente con cómo ya
 * se carga el resto de la Biblioteca, ver seed-library-data.ts). Para
 * agregar una dosis nueva: sumá un objeto acá y corré `npx prisma db seed`
 * (es idempotente, ver seedDoses() abajo — no duplica las que ya existen).
 */
export type SeedDoseAction = { text: string; detail: string };

export type SeedDose = {
  title: string;
  area: string; // HabitCategory
  hookTemplate: string;
  hookQuestion: string;
  hookOptions: string[];
  hookAnswer: string;
  guessQuestion: string;
  guessMin: number;
  guessMax: number;
  guessStep: number;
  guessRealValue: number;
  guessExplanation: string;
  holdInstruction: string;
  holdCompletionText: string;
  actions: [SeedDoseAction, SeedDoseAction, SeedDoseAction];
  sortOrder: number;
};

export const SEED_DOSES: SeedDose[] = [
  {
    title: "El 40 % de tu mente",
    area: "FISICO",
    // `{habito}` se resuelve con "cumpliste con «Salir a hacer ejercicio»"
    // (o el hábito real pendiente de ayer, prioridad alta) — ver
    // resolveHookText() en apps/web/src/components/Library/doseSelector.ts.
    // Sin ese dato, se resuelve a una cláusula genérica (nunca se inventa un
    // hábito que no existe).
    hookTemplate: "Ayer no {habito}, aunque era prioridad alta.",
    hookQuestion: "Sé honesto: ¿qué te dijo tu mente?",
    hookOptions: ["Estoy muy cansado", "Mañana lo hago", "No tengo tiempo"],
    hookAnswer: "Esa voz es tu cerebro ahorrando energía. No es un defecto tuyo: le pasa a todos. La pregunta es quién manda.",
    guessQuestion: "Cuando sientes \"ya no puedo más\", ¿qué porcentaje de tu capacidad real crees que llevas?",
    guessMin: 10,
    guessMax: 100,
    guessStep: 5,
    guessRealValue: 40,
    guessExplanation: "Según Goggins, cuando tu mente dice \"ya no puedo\", apenas vas por el 40 %. El resto está esperando a que lo pidas.",
    holdInstruction: "Mantén presionado el círculo hasta llenarlo. Tu mente te va a pedir soltarlo antes.",
    holdCompletionText: "Eso es un callo mental: seguir unos segundos más de lo que tu mente quiere. Se fortalece igual que un músculo.",
    actions: [
      { text: "Salir a caminar 10 minutos", detail: "hoy, antes de las 7 p. m." },
      { text: "Hacer 20 sentadillas ahora", detail: "toma 1 minuto" },
      { text: "Agendar el ejercicio a una hora fija", detail: "para mañana temprano" },
    ],
    sortOrder: 1,
  },
];

/**
 * Idempotente (mismo criterio que seedLibrary): si ya hay alguna Dose
 * cargada, no vuelve a insertar. La fuente ("No me puedes lastimar", David
 * Goggins) se busca/crea como LibraryEntry LIBRO sin resumen/idea/ideas
 * (vacíos para que el usuario los escriba, igual que cualquier libro
 * nuevo) — nunca se inventa su contenido acá, solo título y autor, que sí
 * los dio el usuario.
 *
 * La frase que desbloquea ("recompensa") se vincula a la PRIMERA frase
 * existente en la Biblioteca (la más vieja, `source: "SEED"`) como punto de
 * partida — ninguna frase en particular es "la correcta" sin que el usuario
 * elija una, así que se documenta acá para que la cambie fácil si quiere
 * otra: `prisma.dose.update({ where: { title: "El 40 % de tu mente" }, data:
 * { rewardEntryId: "<id de la frase que prefiera>" } })`. Si todavía no hay
 * NINGUNA frase cargada, esta dosis de ejemplo se omite (no se inventa una
 * frase nueva para que exista un ejemplo) y se avisa por consola.
 */
export async function seedDoses(prisma: PrismaClient): Promise<void> {
  const alreadySeeded = await prisma.dose.count();
  if (alreadySeeded > 0) return;

  const rewardQuote = await prisma.libraryEntry.findFirst({
    where: { section: "FRASE" },
    orderBy: { createdAt: "asc" },
  });
  if (!rewardQuote) {
    console.warn("[seedDoses] No hay ninguna FRASE en la Biblioteca todavía — se omite la dosis de ejemplo hasta que haya una.");
    return;
  }

  for (const dose of SEED_DOSES) {
    let sourceEntry = await prisma.libraryEntry.findFirst({
      where: { section: "LIBRO", source: "SEED", title: "No me puedes lastimar" },
    });
    if (!sourceEntry) {
      sourceEntry = await prisma.libraryEntry.create({
        data: { section: "LIBRO", source: "SEED", title: "No me puedes lastimar", author: "David Goggins", content: "" },
      });
    }

    await prisma.dose.create({
      data: {
        title: dose.title,
        area: dose.area,
        sourceEntryId: sourceEntry.id,
        hookTemplate: dose.hookTemplate,
        hookQuestion: dose.hookQuestion,
        hookOptionsJson: JSON.stringify(dose.hookOptions),
        hookAnswer: dose.hookAnswer,
        guessQuestion: dose.guessQuestion,
        guessMin: dose.guessMin,
        guessMax: dose.guessMax,
        guessStep: dose.guessStep,
        guessRealValue: dose.guessRealValue,
        guessExplanation: dose.guessExplanation,
        holdInstruction: dose.holdInstruction,
        holdCompletionText: dose.holdCompletionText,
        rewardEntryId: rewardQuote.id,
        actionsJson: JSON.stringify(dose.actions),
        sortOrder: dose.sortOrder,
      },
    });
  }
}
