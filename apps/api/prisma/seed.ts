import { prisma } from "../src/db";
import { seedDoses } from "./seed-doses";
import { seedLibrary } from "./seed-library-data";
import { seedLibrarySchools } from "./seed-library-schools";

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
  // Cada hábito/ciclo necesita un dueño (`userId`, ver migración
  // add_user_ownership): el seed ya no puede crearlos "al aire". No se crea
  // una cuenta descartable acá (quedaría con una contraseña que nadie
  // conoce, inútil para loguearse) — se usa la primera cuenta real que ya
  // exista, registrada desde la app.
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error(
      "No hay ninguna cuenta creada todavía. Registrate primero (POST /api/auth/register, o desde /register en la app) y volvé a correr el seed.",
    );
    process.exit(1);
  }

  // Semilla de hábitos/Ciclo 1: SOLO la primera vez que se corre el seed
  // para esta cuenta (sin esto, cada `npx prisma db seed` posterior — p. ej.
  // para cargar contenido nuevo de Biblioteca — volvía a crear estos 12
  // hábitos de arranque desde cero, duplicando los que el usuario ya había
  // editado/renombrado/desactivado. Incidente real: 2026-10-31).
  const existingHabitCount = await prisma.habit.count({ where: { userId: user.id } });
  if (existingHabitCount === 0) {
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
          userId: user.id,
        },
      });
    }

    await prisma.cycle.create({
      data: {
        name: "Ciclo 1",
        startDate: utcMidnight(2026, 9, 14),
        endDate: utcMidnight(2026, 10, 13),
        userId: user.id,
      },
    });

    console.log(`Sembrados ${habits.length} hábitos y Ciclo 1 para ${user.email}.`);
  } else {
    console.log(`${user.email} ya tiene ${existingHabitCount} hábito(s) — se omite la semilla de hábitos/Ciclo 1 (no es la primera vez que se corre el seed).`);
  }

  await seedLibrary(prisma);
  await seedLibrarySchools(prisma);
  await seedDoses(prisma);

  console.log("Seed de Biblioteca completo.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
