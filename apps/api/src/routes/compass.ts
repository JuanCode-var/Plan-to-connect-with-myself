import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { parseDateOnlyToUtcMidnight, todayLocalISO } from "../date-utils";

const router = Router();

const PILLAR_FIELD = {
  autoconocimiento: "pillarAutoconocimientoSealedAt",
  valores: "pillarValoresSealedAt",
  proposito: "pillarPropositoSealedAt",
} as const;
type PillarKey = keyof typeof PILLAR_FIELD;

function addDaysToISO(dateISO: string, days: number): string {
  const d = parseDateOnlyToUtcMidnight(dateISO);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// GET /api/compass — el documento completo (sin candado): null si todavía
// no existe la fila, que es como RequireAuth.tsx sabe si forzar el
// cuestionario obligatorio post-registro.
router.get("/", async (req, res) => {
  const compass = await prisma.compass.findUnique({
    where: { userId: req.userId! },
    include: {
      identities: { orderBy: { sortOrder: "asc" } },
      weaknesses: { orderBy: { sortOrder: "asc" } },
    },
  });
  res.json(compass);
});

const saveProfileSchema = z
  .object({
    uniqueness: z.string(),
    enjoyWithoutBeingAsked: z.string(),
    strengths: z.string(),
    coreValues: z.string(),
    limitingBeliefs: z.string(),
    beliefsToReprogram: z.string(),
    empoweringBeliefs: z.string(),
    cause: z.string(),
    impact: z.string(),
    howToLiveDays: z.string(),
    // "Hábitos por identidad": frase de identidad por área, editable
    // tocándola en su tarjeta — ver DEFAULT_AREA_IDENTITY en el frontend
    // para el texto que se muestra mientras esto siga sin tocar.
    identityMental: z.string(),
    identityEconomica: z.string(),
    identityHabilidades: z.string(),
    identityEmocional: z.string(),
    identityFisica: z.string(),
    identityEspiritual: z.string(),
  })
  .partial();

// PUT /api/compass — crea el documento si todavía no existe (primer guardado
// del wizard obligatorio) o actualiza los campos recibidos. Nunca borra un
// campo no incluido en el body — el wizard guarda sección por sección, así
// que cada llamada solo trae los campos de ESA sección.
router.put("/", async (req, res) => {
  const parsed = saveProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const compass = await prisma.compass.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId!, ...parsed.data },
    update: parsed.data,
    include: {
      identities: { orderBy: { sortOrder: "asc" } },
      weaknesses: { orderBy: { sortOrder: "asc" } },
    },
  });
  res.json(compass);
});

// PUT /api/compass/review — "Seguimiento Semanal": ya repasé
// Autoconocimiento/Valores/Propósito. Resetea el contador del banner (cada
// 8 días, ver CompassReviewBanner.tsx).
router.put("/review", async (req, res) => {
  const compass = await prisma.compass.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId!, lastReviewedAt: new Date() },
    update: { lastReviewedAt: new Date() },
  });
  res.json({ lastReviewedAt: compass.lastReviewedAt });
});

const identitiesSchema = z.object({
  items: z.array(z.object({ statement: z.string().min(1), why: z.string() })).max(20),
});

// PUT /api/compass/identities — "Mi ideal", sin cambios respecto a antes:
// reemplaza la lista completa, en el orden recibido.
router.put("/identities", async (req, res) => {
  const parsed = identitiesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const compass = await prisma.compass.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId! },
    update: {},
  });

  await prisma.$transaction([
    prisma.identity.deleteMany({ where: { compassId: compass.id } }),
    prisma.identity.createMany({
      data: parsed.data.items.map((item, index) => ({
        compassId: compass.id,
        statement: item.statement,
        why: item.why || null,
        sortOrder: index + 1,
      })),
    }),
  ]);

  const identities = await prisma.identity.findMany({
    where: { compassId: compass.id },
    orderBy: { sortOrder: "asc" },
  });
  res.json(identities);
});

const weaknessesSchema = z.object({
  items: z.array(z.object({ text: z.string().min(1), counterMessage: z.string() })).max(20),
});

// PUT /api/compass/weaknesses — "¿Qué debilidades acepto y estoy
// trabajando?", cada una con su contramensaje propio (opcional). Mismo
// patrón bulk-replace que /identities.
router.put("/weaknesses", async (req, res) => {
  const parsed = weaknessesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const compass = await prisma.compass.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId! },
    update: {},
  });

  await prisma.$transaction([
    prisma.weakness.deleteMany({ where: { compassId: compass.id } }),
    prisma.weakness.createMany({
      data: parsed.data.items.map((item, index) => ({
        compassId: compass.id,
        text: item.text,
        counterMessage: item.counterMessage || null,
        sortOrder: index + 1,
      })),
    }),
  ]);

  const weaknesses = await prisma.weakness.findMany({
    where: { compassId: compass.id },
    orderBy: { sortOrder: "asc" },
  });
  res.json(weaknesses);
});

const messagesEnabledSchema = z.object({ messagesEnabled: z.boolean() });

// PUT /api/compass/messages-enabled — interruptor general de las
// intervenciones de identidad (etapa 3). Distinto del por-hábito
// (Habit.identityMessagesEnabled, ver routes/habits.ts) — este apaga todo.
router.put("/messages-enabled", async (req, res) => {
  const parsed = messagesEnabledSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Falta messagesEnabled" });
    return;
  }

  const compass = await prisma.compass.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId!, messagesEnabled: parsed.data.messagesEnabled },
    update: { messagesEnabled: parsed.data.messagesEnabled },
  });
  res.json({ messagesEnabled: compass.messagesEnabled });
});

// Las 3 preguntas principales de cada sección (texto libre) más al menos 1
// debilidad y 1 valor cargados — mismo criterio que valida el wizard del
// cliente, repetido acá porque el cliente no es de fiar para algo que se
// supone 100% obligatorio (podría llamarse esta ruta directo sin pasar por
// el wizard).
function hasRequiredContent(
  compass: {
    uniqueness: string | null;
    enjoyWithoutBeingAsked: string | null;
    strengths: string | null;
    coreValues: string | null;
    limitingBeliefs: string | null;
    beliefsToReprogram: string | null;
    empoweringBeliefs: string | null;
    cause: string | null;
    impact: string | null;
    howToLiveDays: string | null;
  } | null,
  weaknessCount: number,
): boolean {
  if (!compass) return false;
  const requiredText = [
    compass.uniqueness,
    compass.enjoyWithoutBeingAsked,
    compass.strengths,
    compass.coreValues,
    compass.limitingBeliefs,
    compass.beliefsToReprogram,
    compass.empoweringBeliefs,
    compass.cause,
    compass.impact,
    compass.howToLiveDays,
  ];
  return requiredText.every((v) => !!v && v.trim().length > 0) && weaknessCount > 0;
}

// PUT /api/compass/complete-onboarding — marca el cuestionario obligatorio
// como terminado (ver identityOnboardingCompletedAt, leído por
// RequireAuth.tsx en el frontend para decidir si forzar el wizard). Valida
// en el servidor que las preguntas principales tengan contenido — no basta
// con que el wizard del cliente lo haya permitido.
router.put("/complete-onboarding", async (req, res) => {
  const compass = await prisma.compass.findUnique({
    where: { userId: req.userId! },
    include: { weaknesses: true },
  });

  if (!hasRequiredContent(compass, compass?.weaknesses.length ?? 0)) {
    res.status(400).json({ error: "Faltan respuestas obligatorias para terminar" });
    return;
  }

  // Terminar el cuestionario cuenta como la primera "revisión" — el
  // contador de 8 días (Seguimiento Semanal) arranca desde acá, no desde
  // null (que mostraría el banner "todavía no revisaste" apenas se entra
  // por primera vez a /tracker).
  const now = new Date();
  const updated = await prisma.compass.update({
    where: { userId: req.userId! },
    data: { identityOnboardingCompletedAt: now, lastReviewedAt: now },
  });
  res.json({ identityOnboardingCompletedAt: updated.identityOnboardingCompletedAt });
});

const createReflectionSchema = z.object({
  answer: z.string().min(1),
  date: z.string().min(1),
  context: z.string().min(1).optional(),
});

// POST /api/compass/reflections — hoy el único origen es el trigger de
// "¿qué se interpuso?" (etapa 3, vía `context`).
router.post("/reflections", async (req, res) => {
  const parsed = createReflectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  let date: Date;
  try {
    date = parseDateOnlyToUtcMidnight(parsed.data.date);
  } catch {
    res.status(400).json({ error: "Fecha inválida, se espera YYYY-MM-DD" });
    return;
  }

  const compass = await prisma.compass.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId! },
    update: {},
  });

  const reflection = await prisma.compassReflection.create({
    data: { compassId: compass.id, answer: parsed.data.answer, context: parsed.data.context, date },
  });
  res.status(201).json(reflection);
});

// GET /api/compass/reflections — el diario, más reciente primero.
router.get("/reflections", async (req, res) => {
  const compass = await prisma.compass.findUnique({ where: { userId: req.userId! } });
  if (!compass) {
    res.json([]);
    return;
  }

  const reflections = await prisma.compassReflection.findMany({
    where: { compassId: compass.id },
    orderBy: { date: "desc" },
  });
  res.json(reflections);
});

// GET /api/compass/pillars — estado de "Mi núcleo de identidad": qué pilares
// están sellados en el recorrido actual, el progreso de HOY (fortalezas
// usadas/valores vividos/creencia reprogramada) y la acción de Propósito de
// hoy si ya se eligió una. `nextReviewSuggestedAt` = lastFullPillarsJourneyAt
// + 7 días, lo que alimenta "Próximo recorrido sugerido" (Núcleo Integrado)
// y, indirectamente, el botón Repasar (ver compass.lastReviewedAt).
router.get("/pillars", async (req, res) => {
  const compass = await prisma.compass.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId! },
    update: {},
  });

  const today = parseDateOnlyToUtcMidnight(todayLocalISO());
  const [todayProgress, purposeAction] = await Promise.all([
    prisma.identityDailyProgress.findUnique({ where: { compassId_date: { compassId: compass.id, date: today } } }),
    prisma.microAction.findFirst({ where: { compassId: compass.id, date: today, origin: "PROPOSITO" } }),
  ]);

  res.json({
    sealed: {
      autoconocimiento: compass.pillarAutoconocimientoSealedAt,
      valores: compass.pillarValoresSealedAt,
      proposito: compass.pillarPropositoSealedAt,
    },
    lastFullPillarsJourneyAt: compass.lastFullPillarsJourneyAt,
    nextReviewSuggestedAt: compass.lastFullPillarsJourneyAt ? parseDateOnlyToUtcMidnight(addDaysToISO(todayLocalISO(compass.lastFullPillarsJourneyAt), 7)) : null,
    today: {
      strengthsUsed: todayProgress?.strengthsUsed ? (JSON.parse(todayProgress.strengthsUsed) as string[]) : [],
      valuesLived: todayProgress?.valuesLived ? (JSON.parse(todayProgress.valuesLived) as string[]) : [],
      beliefsReprogrammed: todayProgress?.beliefsReprogrammed ?? false,
      purposeAction,
    },
  });
});

const pillarsProgressSchema = z
  .object({
    strengthsUsed: z.array(z.string()),
    valuesLived: z.array(z.string()),
    beliefsReprogrammed: z.boolean(),
  })
  .partial();

// PUT /api/compass/pillars/progress — guarda el progreso de HOY de los
// pilares (una fila por día, ver IdentityDailyProgress). El frontend manda
// el array completo deseado en cada toggle (mismo criterio que
// /identities y /weaknesses), no un solo ítem.
router.put("/pillars/progress", async (req, res) => {
  const parsed = pillarsProgressSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const compass = await prisma.compass.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId! },
    update: {},
  });

  const today = parseDateOnlyToUtcMidnight(todayLocalISO());
  const data = {
    ...(parsed.data.strengthsUsed !== undefined ? { strengthsUsed: JSON.stringify(parsed.data.strengthsUsed) } : {}),
    ...(parsed.data.valuesLived !== undefined ? { valuesLived: JSON.stringify(parsed.data.valuesLived) } : {}),
    ...(parsed.data.beliefsReprogrammed !== undefined ? { beliefsReprogrammed: parsed.data.beliefsReprogrammed } : {}),
  };

  const progress = await prisma.identityDailyProgress.upsert({
    where: { compassId_date: { compassId: compass.id, date: today } },
    create: { compassId: compass.id, date: today, ...data },
    update: data,
  });

  res.json({
    strengthsUsed: progress.strengthsUsed ? (JSON.parse(progress.strengthsUsed) as string[]) : [],
    valuesLived: progress.valuesLived ? (JSON.parse(progress.valuesLived) as string[]) : [],
    beliefsReprogrammed: progress.beliefsReprogrammed,
  });
});

const sealPillarSchema = z.object({ pillar: z.enum(["autoconocimiento", "valores", "proposito"]) });

// POST /api/compass/pillars/seal — cruzar el umbral de un pilar. Si con este
// quedan los 3 sellados, se completa el recorrido: se guarda
// lastFullPillarsJourneyAt (y lastReviewedAt, mismo campo que ya usa
// "Seguimiento Semanal" — completar el recorrido también cuenta como
// repaso), y los 3 sellos vuelven a null para que el próximo recorrido
// arranque de 0 de 3.
router.post("/pillars/seal", async (req, res) => {
  const parsed = sealPillarSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const compass = await prisma.compass.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId! },
    update: {},
  });

  const field = PILLAR_FIELD[parsed.data.pillar as PillarKey];
  const now = new Date();
  const sealed = await prisma.compass.update({ where: { id: compass.id }, data: { [field]: now } });

  const allSealed = !!sealed.pillarAutoconocimientoSealedAt && !!sealed.pillarValoresSealedAt && !!sealed.pillarPropositoSealedAt;

  if (!allSealed) {
    res.json({ allSealed: false });
    return;
  }

  const completed = await prisma.compass.update({
    where: { id: compass.id },
    data: {
      lastFullPillarsJourneyAt: now,
      lastReviewedAt: now,
      pillarAutoconocimientoSealedAt: null,
      pillarValoresSealedAt: null,
      pillarPropositoSealedAt: null,
    },
  });

  res.json({
    allSealed: true,
    nextReviewSuggestedAt: parseDateOnlyToUtcMidnight(addDaysToISO(todayLocalISO(completed.lastFullPillarsJourneyAt!), 7)),
  });
});

const purposeActionSchema = z.object({ text: z.string().min(1) });

// POST /api/compass/pillars/purpose-action — "Tu propósito, hoy": crea (o
// actualiza, si el usuario cambia de opción el mismo día) una MicroAction
// real con origin PROPOSITO, sin learningId (ver MicroAction.learningId
// nullable) — aparece en la Revisión del día como cualquier otra.
router.post("/pillars/purpose-action", async (req, res) => {
  const parsed = purposeActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const compass = await prisma.compass.upsert({
    where: { userId: req.userId! },
    create: { userId: req.userId! },
    update: {},
  });

  const today = parseDateOnlyToUtcMidnight(todayLocalISO());
  const existing = await prisma.microAction.findFirst({ where: { compassId: compass.id, date: today, origin: "PROPOSITO" } });

  const microAction = existing
    ? await prisma.microAction.update({ where: { id: existing.id }, data: { text: parsed.data.text } })
    : await prisma.microAction.create({
        data: { userId: req.userId!, compassId: compass.id, text: parsed.data.text, date: today, origin: "PROPOSITO" },
      });

  res.status(existing ? 200 : 201).json(microAction);
});

export default router;
