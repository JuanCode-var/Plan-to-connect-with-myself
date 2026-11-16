import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { habitCategorySchema, habitMomentSchema, habitPrioritySchema, type HabitPriority } from "../domain";
import { calculateCompletionRateByHabit, catalogStageFor, parseActiveWeekdays, toDateOnlyISO } from "../services/tracking";
import { enumerateDaysISO, parseDateOnlyToUtcMidnight, todayLocalISO } from "../date-utils";

const router = Router();

// Mismos 3 valores que NEURAL_IMPULSE_POINTS en apps/web/src/components/
// NeuralCore/tokens.ts — si cambiás uno, cambiá el otro.
const PRIORITY_IMPULSE_POINTS: Record<HabitPriority, number> = { ALTA: 3, MEDIA: 2, BAJA: 1 };

function addDaysToISO(dateISO: string, days: number): string {
  const d = parseDateOnlyToUtcMidnight(dateISO);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// El cliente manda/recibe `activeWeekdays` como number[] | null (0=domingo..
// 6=sábado); la base lo guarda como CSV (ver comentario en schema.prisma).
// `null` o los 7 días = "todos los días", igual de ida que de vuelta.
function toActiveWeekdaysColumn(value: number[] | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const unique = Array.from(new Set(value)).filter((n) => n >= 0 && n <= 6);
  return unique.length > 0 && unique.length < 7 ? unique.sort((a, b) => a - b).join(",") : null;
}

function serializeHabit<T extends { activeWeekdays: string | null }>(habit: T): Omit<T, "activeWeekdays"> & { activeWeekdays: number[] | null } {
  return { ...habit, activeWeekdays: parseActiveWeekdays(habit.activeWeekdays) };
}

router.get("/", async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { active: true, userId: req.userId! },
    orderBy: { sortOrder: "asc" },
  });
  res.json(habits.map(serializeHabit));
});

// GET /api/habits/identity-stats — alimenta "Mi Identidad": las acciones de
// esta semana (impulsos de cada hábito cumplido, ponderados por prioridad,
// ver PRIORITY_IMPULSE_POINTS) y, por hábito, sus impulsos de toda la vida
// + racha actual — para "Ya eres alguien que..." (ver myelinStage() en
// apps/web/src/components/NeuralCore/brainTokens.ts, que ya usa estos
// mismos umbrales pero por ÁREA; acá se reutiliza por HÁBITO individual).
// Ruta literal antes de "/:id" para que no choque con esa.
router.get("/identity-stats", async (req, res) => {
  const userId = req.userId!;
  const today = todayLocalISO();
  const weekStart = addDaysToISO(today, -6);

  const habits = await prisma.habit.findMany({ where: { userId, active: true } });
  const logs = await prisma.habitLog.findMany({
    where: { habitId: { in: habits.map((h) => h.id) }, status: "DONE" },
    orderBy: { date: "desc" },
    select: { habitId: true, date: true },
  });

  const logsByHabit = new Map<string, Date[]>();
  for (const log of logs) {
    const arr = logsByHabit.get(log.habitId) ?? [];
    arr.push(log.date);
    logsByHabit.set(log.habitId, arr);
  }

  let weeklyTotal = 0;
  const weeklyByCategory: Partial<Record<string, number>> = {};

  const habitStats = habits.map((habit) => {
    const dates = logsByHabit.get(habit.id) ?? [];
    const points = PRIORITY_IMPULSE_POINTS[habit.priority as HabitPriority];
    const lifetimeImpulses = dates.length * points;

    // Racha actual: días consecutivos (calendario, sin huecos) cumplidos,
    // contando hacia atrás desde la fila DONE más reciente — ver comentario
    // del archivo sobre por qué no se reconstruye el calendario completo
    // entre ciclos.
    let currentStreak = 0;
    let cursor: string | null = null;
    for (const date of dates) {
      const dateISO = toDateOnlyISO(date);
      if (cursor === null || dateISO === addDaysToISO(cursor, -1)) {
        currentStreak += 1;
        cursor = dateISO;
      } else {
        break;
      }
    }

    for (const dateISO of dates.map(toDateOnlyISO)) {
      if (dateISO >= weekStart && dateISO <= today) {
        weeklyTotal += points;
        weeklyByCategory[habit.category] = (weeklyByCategory[habit.category] ?? 0) + points;
      }
    }

    return {
      habitId: habit.id,
      name: habit.name,
      category: habit.category,
      priority: habit.priority,
      lifetimeImpulses,
      currentStreak,
    };
  });

  res.json({
    weeklyActions: { total: weeklyTotal, byCategory: weeklyByCategory },
    habits: habitStats,
  });
});

function daysSinceCreatedOf(createdAt: Date, today: string): number {
  const createdISO = toDateOnlyISO(createdAt);
  const diffMs = parseDateOnlyToUtcMidnight(today).getTime() - parseDateOnlyToUtcMidnight(createdISO).getTime();
  return Math.floor(diffMs / 86_400_000) + 1;
}

// GET /api/habits/catalog — alimenta el Catálogo de hábitos (mockups 16/16b):
// TODOS los hábitos (activos Y pausados, a diferencia de GET / que solo trae
// activos — acá hace falta ver los pausados para poder reanudarlos) con su
// % de mielinización (días cumplidos / días programados, últimos 30 días o
// desde su creación si es más joven, ver catalogStageFor en services/
// tracking.ts) y su etapa. Ruta literal antes de "/:id" para que no choque.
router.get("/catalog", async (req, res) => {
  const userId = req.userId!;
  const today = todayLocalISO();
  const windowStart = addDaysToISO(today, -29);
  const days = enumerateDaysISO(parseDateOnlyToUtcMidnight(windowStart), parseDateOnlyToUtcMidnight(today));

  const habits = await prisma.habit.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } });
  const habitIds = habits.map((h) => h.id);

  const [windowLogs, lifetimeDoneCounts] = await Promise.all([
    prisma.habitLog.findMany({
      where: { habitId: { in: habitIds }, date: { gte: parseDateOnlyToUtcMidnight(windowStart) } },
      select: { habitId: true, date: true, status: true },
    }),
    prisma.habitLog.groupBy({ by: ["habitId"], where: { habitId: { in: habitIds }, status: "DONE" }, _count: { _all: true } }),
  ]);

  const lifetimeDoneByHabit = new Map(lifetimeDoneCounts.map((c) => [c.habitId, c._count._all]));
  const percentByHabit = calculateCompletionRateByHabit(habits, days, windowLogs);

  // Para "ÚLTIMOS 30 DÍAS" del panel de detalle (Paso 5 del rediseño de
  // identidad): un booleano por día de la ventana, más barato de armar acá
  // (los logs ya están en memoria) que con un fetch aparte por hábito.
  const statusLookup = new Map<string, string>();
  for (const log of windowLogs) statusLookup.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);

  res.json(
    habits.map((habit) => {
      const percent = percentByHabit[habit.id] ?? 0;
      const lifetimeDone = lifetimeDoneByHabit.get(habit.id) ?? 0;
      const stage = catalogStageFor(percent, daysSinceCreatedOf(habit.createdAt, today), lifetimeDone);
      const last30 = days.map((d) => statusLookup.get(`${habit.id}|${d}`) === "DONE");
      return { ...serializeHabit(habit), percent: Math.round(percent * 100), stage, lifetimeDone, last30 };
    }),
  );
});

const activeWeekdaysSchema = z.array(z.number().int().min(0).max(6)).nullable().optional();

const createHabitSchema = z.object({
  name: z.string().min(1),
  moment: habitMomentSchema,
  specification: z.string().min(1),
  category: habitCategorySchema,
  priority: habitPrioritySchema,
  // "Mi Brújula": a qué versión de uno mismo le sirve este hábito, y su
  // versión mínima de 2 minutos (ambos opcionales). `identityId` vacío se
  // normaliza a null — "Sin vincular" en el selector del frontend llega
  // como "".
  identityId: z.string().min(1).nullable().optional(),
  minimalVersion: z.string().nullable().optional(),
  // "Hábitos por identidad": completa "Me convierte en alguien que…".
  meConvierteEn: z.string().min(1).nullable().optional(),
  activeWeekdays: activeWeekdaysSchema,
});

// Si viene `identityId`, confirma que esa Identity pertenezca al usuario
// (a través de su Compass) antes de guardar — mismo criterio que la
// verificación de cycleId en routes/goals.ts: nunca confiar un FK ajeno
// solo porque el body lo trae.
async function assertOwnIdentity(identityId: string | null | undefined, userId: string): Promise<boolean> {
  if (!identityId) return true;
  const identity = await prisma.identity.findFirst({ where: { id: identityId, compass: { userId } } });
  return !!identity;
}

router.post("/", async (req, res) => {
  const parsed = createHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (!(await assertOwnIdentity(parsed.data.identityId, req.userId!))) {
    res.status(400).json({ error: "Identidad no encontrada" });
    return;
  }

  const last = await prisma.habit.findFirst({
    where: { userId: req.userId! },
    orderBy: { sortOrder: "desc" },
  });
  const habit = await prisma.habit.create({
    data: {
      ...parsed.data,
      activeWeekdays: toActiveWeekdaysColumn(parsed.data.activeWeekdays),
      userId: req.userId!,
      sortOrder: (last?.sortOrder ?? 0) + 1,
      active: true,
    },
  });
  res.status(201).json(serializeHabit(habit));
});

const reorderHabitsSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

// PUT /api/habits/reorder — nuevo orden (dentro de un mismo momento del
// día, ver Habits.tsx) de los hábitos listados en `ids`. En vez de
// renumerar TODO sortOrder (que es un contador global, no por momento, ver
// POST / más arriba), se toman los valores de sortOrder que esos mismos
// hábitos ya tenían, se ordenan ascendente y se reasignan según la posición
// nueva — así ningún otro hábito (de otro momento) se ve afectado. Ruta
// literal antes de "/:id" para que no choque con esa.
router.put("/reorder", async (req, res) => {
  const parsed = reorderHabitsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { ids } = parsed.data;
  // `userId` en el filtro: además de traer los hábitos, esto verifica que
  // TODOS pertenezcan a quien hace el pedido (si alguno es de otra cuenta,
  // `habits.length` queda corto y se rechaza abajo).
  const habits = await prisma.habit.findMany({ where: { id: { in: ids }, userId: req.userId! } });
  if (habits.length !== ids.length) {
    res.status(400).json({ error: "Alguno de los hábitos no existe" });
    return;
  }

  const sortedValues = habits.map((h) => h.sortOrder).sort((a, b) => a - b);
  await prisma.$transaction(
    ids.map((id, i) => prisma.habit.update({ where: { id }, data: { sortOrder: sortedValues[i] } })),
  );

  res.status(204).send();
});

const updateHabitSchema = z
  .object({
    name: z.string().min(1),
    moment: habitMomentSchema,
    specification: z.string().min(1),
    category: habitCategorySchema,
    priority: habitPrioritySchema,
    active: z.boolean(),
    identityId: z.string().min(1).nullable(),
    minimalVersion: z.string().nullable(),
    meConvierteEn: z.string().min(1).nullable(),
    identityMessagesEnabled: z.boolean(),
    activeWeekdays: activeWeekdaysSchema,
  })
  .partial();

router.patch("/:id", async (req, res) => {
  const parsed = updateHabitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) {
    res.status(404).json({ error: "Hábito no encontrado" });
    return;
  }

  if (!(await assertOwnIdentity(parsed.data.identityId, req.userId!))) {
    res.status(400).json({ error: "Identidad no encontrada" });
    return;
  }

  const habit = await prisma.habit.update({
    where: { id: existing.id },
    data: { ...parsed.data, activeWeekdays: toActiveWeekdaysColumn(parsed.data.activeWeekdays) },
  });
  res.json(serializeHabit(habit));
});

router.delete("/:id", async (req, res) => {
  const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!habit) {
    res.status(404).json({ error: "Hábito no encontrado" });
    return;
  }

  // Igual que DELETE /cycles/:id: borrar el hábito se lleva sus HabitLog
  // (decisión explícita, no default de Prisma — la relación no tiene
  // onDelete: Cascade en el schema).
  await prisma.$transaction([
    prisma.habitLog.deleteMany({ where: { habitId: habit.id } }),
    prisma.habit.delete({ where: { id: habit.id } }),
  ]);

  res.status(204).send();
});

export default router;
