import { PrismaClient } from "@prisma/client";
import { seedLibrary } from "./seed-library-data";

const prisma = new PrismaClient();

// Contrato de valores (ver nota en schema.prisma: SQLite no soporta enums nativos
// en Prisma, así que HabitMoment, HabitCategory, HabitPriority y LogStatus se
// validan como String).
// HabitMoment:   MANANA | DIA | NOCHE | CIERRE_DEL_DIA
// HabitCategory: FISICO | ECONOMICO | MENTAL | EMOCIONAL | HABILIDADES | ESPIRITUAL (área de vida)
// HabitPriority: ALTA | MEDIA | BAJA (urgencia, campo independiente de la categoría)

type SeedHabit = {
  name: string;
  moment: "MANANA" | "DIA" | "NOCHE" | "CIERRE_DEL_DIA";
  category: "FISICO" | "ECONOMICO" | "MENTAL" | "EMOCIONAL" | "HABILIDADES" | "ESPIRITUAL";
  priority: "ALTA" | "MEDIA" | "BAJA";
  specification: string;
};

// Fecha pura a medianoche UTC (sin componente de hora local). Nunca usar
// `new Date()` directo para construir fechas de dominio (Habit/Cycle logs).
function utcMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

const habits: SeedHabit[] = [
  {
    name: "Luz natural al despertar",
    moment: "MANANA",
    category: "FISICO",
    priority: "MEDIA",
    specification:
      "Exponerte a luz natural (ventana o exterior) durante los primeros 30 minutos después de despertar.",
  },
  {
    name: "Creatina monohidratada",
    moment: "MANANA",
    category: "FISICO",
    priority: "BAJA",
    specification: "Tomar 3 g de creatina monohidratada con el desayuno.",
  },
  {
    name: "Melena de león",
    moment: "MANANA",
    category: "FISICO",
    priority: "BAJA",
    specification:
      "Tomar la dosis indicada de melena de león (opcional, evidencia limitada en humanos).",
  },
  {
    name: "Levadura de cerveza",
    moment: "MANANA",
    category: "FISICO",
    priority: "BAJA",
    specification:
      "Tomar la dosis indicada de levadura de cerveza (opcional, evidencia limitada en humanos).",
  },
  {
    name: "Cero apuestas",
    moment: "DIA",
    category: "ECONOMICO",
    priority: "ALTA",
    specification:
      "No realizar ninguna apuesta en todo el día, en ninguna plataforma ni modalidad.",
  },
  {
    name: "Cero alcohol",
    moment: "DIA",
    category: "FISICO",
    priority: "ALTA",
    specification: "No consumir alcohol en todo el día, en ninguna cantidad.",
  },
  {
    name: "Entrenamiento o movimiento",
    moment: "DIA",
    category: "FISICO",
    priority: "MEDIA",
    specification:
      "Realizar al menos una sesión de entrenamiento o movimiento físico durante el día.",
  },
  {
    name: "Bloque de estudio",
    moment: "DIA",
    category: "HABILIDADES",
    priority: "MEDIA",
    specification: "Cumplir el bloque de estudio planificado para el día.",
  },
  {
    name: "Preparar el sueño",
    moment: "NOCHE",
    category: "FISICO",
    priority: "MEDIA",
    specification:
      "Preparar el ambiente para dormir: reducir pantallas y luz artificial antes de acostarte.",
  },
  {
    name: "Reservar ventana de sueño 7-9h",
    moment: "NOCHE",
    category: "FISICO",
    priority: "MEDIA",
    specification: "Reservar una ventana de 7 a 9 horas para dormir esta noche.",
  },
  {
    name: "Melatonina condicional",
    moment: "NOCHE",
    category: "FISICO",
    priority: "MEDIA",
    specification:
      "Tomar melatonina solo si es necesario; no combinar con alcohol ni usar para compensar trasnochos.",
  },
  {
    name: "Registro emocional y autoconocimiento",
    moment: "CIERRE_DEL_DIA",
    category: "EMOCIONAL",
    priority: "MEDIA",
    specification:
      "Completar el registro emocional del día en /journal como cierre del día.",
  },
];

async function main() {
  for (let i = 0; i < habits.length; i++) {
    const habit = habits[i];
    await prisma.habit.create({
      data: {
        name: habit.name,
        moment: habit.moment,
        category: habit.category,
        priority: habit.priority,
        specification: habit.specification,
        sortOrder: i + 1,
        active: true,
      },
    });
  }

  await prisma.cycle.create({
    data: {
      name: "Ciclo 1",
      startDate: utcMidnight(2026, 9, 14),
      endDate: utcMidnight(2026, 10, 13),
    },
  });

  await seedLibrary(prisma);

  console.log(`Seed completo: ${habits.length} hábitos, Ciclo 1 y la Biblioteca creados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
