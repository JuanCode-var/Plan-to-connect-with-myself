import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { parseDateOnlyToUtcMidnight, todayLocalISO } from "../date-utils";
import { HABIT_CATEGORIES } from "../domain";
import { hashPin, isValidPinFormat, verifyPin } from "../lib/pin";
import {
  currentSegment,
  deriveMonthSegments,
  computeMonthStatus,
  dayWithinSegment,
  finalStateFor,
  formatDurationLabel,
  sealedCount,
  type MonthResolution,
} from "../lib/wordMonths";

const router = Router();

type CommitmentWithMonthsInput = {
  id: string;
  startDate: Date;
  targetDate: Date;
  months: MonthResolution[];
};

/**
 * Deriva, para UN compromiso, todo lo que las pantallas nuevas necesitan
 * para mostrarse (Paso 2/3 del pedido): la etiqueta de duración, los tramos
 * con su estado ya resuelto contra `today`, el tramo "actual" (para "Mes X
 * de Y"), los sellos acumulados y el estado final si ya terminó. Una sola
 * fuente de verdad — ver apps/api/src/lib/wordMonths.ts para la fórmula.
 */
function buildMonthsInfo(c: CommitmentWithMonthsInput, today: Date) {
  const segments = deriveMonthSegments(c.startDate, c.targetDate);
  const current = currentSegment(segments, today);
  const { day, totalDays } = dayWithinSegment(current, today);

  return {
    durationLabel: formatDurationLabel(segments),
    totalMonths: segments.length,
    currentMonthIndex: current.monthIndex,
    sealedCount: sealedCount(c.months),
    finalState: finalStateFor(segments, c.months, today),
    dayOfMonth: day,
    totalDaysInMonth: totalDays,
    months: segments.map((seg) => {
      const row = c.months.find((m) => m.monthIndex === seg.monthIndex);
      return {
        monthIndex: seg.monthIndex,
        startDate: seg.startDate,
        endDate: seg.endDate,
        isPartial: seg.isPartial,
        status: computeMonthStatus(seg, row, today),
        fallReportedAt: row?.fallReportedAt ?? null,
      };
    }),
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function serializeCommitment<
  T extends {
    id: string;
    title: string;
    text: string;
    startDate: Date;
    targetDate: Date;
    area: string | null;
    result: string | null;
    resultConfirmedAt: Date | null;
  },
>(c: T) {
  return {
    id: c.id,
    title: c.title,
    text: c.text,
    startDate: c.startDate,
    targetDate: c.targetDate,
    area: c.area,
    result: c.result,
    resultConfirmedAt: c.resultConfirmedAt,
  };
}

// Trae (o crea, vacío) el WordVault de la cuenta — siempre hay como mucho
// una fila por usuario (@@unique en userId, ver schema.prisma), así que
// "crear si no existe" es seguro de llamar en cualquier ruta de esta
// sección sin arriesgar duplicados.
async function getOrCreateVault(userId: string) {
  const existing = await prisma.wordVault.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wordVault.create({ data: { userId } });
}

// GET /api/word/meta — estado sin exponer ni pedir el PIN: lo que necesita
// la pantalla de candado para saber si mostrar "configurá tu PIN" (primera
// vez) o "ingresá tu PIN" (ya configurado), y si ya hay firma.
router.get("/meta", async (req, res) => {
  const vault = await prisma.wordVault.findUnique({
    where: { userId: req.userId! },
    include: { _count: { select: { commitments: true } } },
  });
  res.json({
    hasPin: !!vault?.pinHash,
    isSigned: !!vault?.signatureDataUrl,
    signedAt: vault?.signedAt ?? null,
    commitmentCount: vault?._count.commitments ?? 0,
  });
});

// GET /api/word/commitments — a diferencia de todo lo demás en esta
// sección, NO pide PIN (solo requireAuth, como el resto de la app): es lo
// que alimenta el bloque de "Mis compromisos" en el Resumen, pensado para
// verse de pasada y motivar, no para quedar escondido detrás de un candado
// cada vez. El PIN sigue protegiendo lo demás — editar, firmar, y el
// manifiesto completo en /palabra.
router.get("/commitments", async (req, res) => {
  const vault = await prisma.wordVault.findUnique({
    where: { userId: req.userId! },
    include: { commitments: { orderBy: { sortOrder: "asc" }, include: { months: true } } },
  });
  const today = parseDateOnlyToUtcMidnight(todayLocalISO());
  res.json(
    (vault?.commitments ?? []).map((c) => {
      const segments = deriveMonthSegments(c.startDate, c.targetDate);
      const pending = segments.find((seg) => computeMonthStatus(seg, c.months.find((m) => m.monthIndex === seg.monthIndex), today) === "pendiente_cierre");
      return {
        ...serializeCommitment(c),
        // Para el recordatorio de cierre (Paso 5) — SIN exponer si está
        // sellado/sin sello, solo que falta responder y desde cuándo. `null`
        // si no hay ningún mes pendiente de cierre ahora mismo.
        pendingClosure: pending ? { monthIndex: pending.monthIndex, endDate: pending.endDate } : null,
      };
    }),
  );
});

// GET /api/word/weight — SIN pin (mismo criterio que GET /commitments): solo
// el número de "Peso de tu palabra" (meses sellados en TODOS los
// compromisos), para mostrar en otras secciones (Paso 6: "Mi núcleo de
// identidad") sin pedir el PIN — nunca expone título/texto de un compromiso
// puntual, así que no hace falta protegerlo.
router.get("/weight", async (req, res) => {
  const vault = await prisma.wordVault.findUnique({
    where: { userId: req.userId! },
    include: { commitments: { include: { months: true } } },
  });
  const monthsWeight = (vault?.commitments ?? []).reduce((sum, c) => sum + sealedCount(c.months), 0);
  res.json({ monthsWeight });
});

const setCommitmentAreaSchema = z.object({ area: z.enum(HABIT_CATEGORIES).nullable() });

/**
 * PATCH /api/word/commitments/:id/area — SIN pin, a propósito, mismo
 * criterio que GET /commitments de arriba: el área es solo una etiqueta de
 * clasificación (qué % de vida alimenta), no el contenido del compromiso en
 * sí, así que vive fuera del candado — se puede cambiar de pasada desde la
 * tarjeta de "Circuitos en recableado" sin pedir el PIN.
 */
router.patch("/commitments/:id/area", async (req, res) => {
  const parsed = setCommitmentAreaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const vault = await prisma.wordVault.findUnique({ where: { userId: req.userId! } });
  const commitment = vault && (await prisma.wordCommitment.findFirst({ where: { id: req.params.id, vaultId: vault.id } }));
  if (!commitment) {
    res.status(404).json({ error: "Compromiso no encontrado" });
    return;
  }

  const updated = await prisma.wordCommitment.update({ where: { id: commitment.id }, data: { area: parsed.data.area } });
  res.json({ id: updated.id, area: updated.area });
});

const setPinSchema = z.object({ newPin: z.string(), currentPin: z.string().optional() });

// POST /api/word/pin — primera vez (sin pinHash todavía) no pide currentPin;
// para cambiar un PIN ya configurado, sí hace falta el actual. A propósito
// no hay forma de "recuperar" el PIN si se olvida más que volviendo a entrar
// con la contraseña de la cuenta — es un candado adicional, no un sistema de
// auth paralelo.
router.post("/pin", async (req, res) => {
  const parsed = setPinSchema.safeParse(req.body);
  if (!parsed.success || !isValidPinFormat(parsed.data.newPin)) {
    res.status(400).json({ error: "El PIN debe tener entre 4 y 8 dígitos numéricos" });
    return;
  }

  const vault = await getOrCreateVault(req.userId!);

  if (vault.pinHash) {
    if (!parsed.data.currentPin || !verifyPin(parsed.data.currentPin, vault.pinHash)) {
      res.status(403).json({ error: "PIN actual incorrecto" });
      return;
    }
  }

  await prisma.wordVault.update({
    where: { id: vault.id },
    data: { pinHash: hashPin(parsed.data.newPin) },
  });
  res.status(204).send();
});

// `today` es opcional (calendario LOCAL del usuario, mismo criterio que
// POST /neural-core/adjust) — sin él, se cae al día del servidor, aceptable
// acá porque solo afecta qué tan "al día" se ve la racha mostrada, nunca
// qué se persiste.
const unlockSchema = z.object({ pin: z.string(), today: z.string().regex(DATE_RE).optional() });

// POST /api/word/unlock — el verdadero "entrar" a la sección: valida el PIN
// y, en el mismo viaje, devuelve los compromisos (ya con sus tramos de mes
// resueltos, ver buildMonthsInfo) y "Peso de tu palabra" (meses sellados en
// TODOS los compromisos). No hay un token de sesión de desbloqueo separado
// a propósito (ver comentario de diseño en README si se agrega uno más
// adelante): cada vez que el frontend quiere mostrar el contenido vuelve a
// pedir el PIN y vuelve a pasar por acá — es justamente el punto de esta
// sección, re-afirmar el compromiso cada vez.
router.post("/unlock", async (req, res) => {
  const parsed = unlockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Falta el PIN" });
    return;
  }

  const vault = await prisma.wordVault.findUnique({
    where: { userId: req.userId! },
    include: {
      commitments: {
        orderBy: { sortOrder: "asc" },
        include: { months: true },
      },
    },
  });
  if (!vault?.pinHash) {
    res.status(400).json({ error: "Todavía no configuraste un PIN" });
    return;
  }
  if (!verifyPin(parsed.data.pin, vault.pinHash)) {
    res.status(401).json({ error: "PIN incorrecto" });
    return;
  }

  const todayISO = parsed.data.today ?? todayLocalISO();
  const today = parseDateOnlyToUtcMidnight(todayISO);
  const monthsWeight = vault.commitments.reduce((sum, c) => sum + sealedCount(c.months), 0);

  res.json({
    commitments: vault.commitments.map((c) => ({
      ...serializeCommitment(c),
      ...buildMonthsInfo(c, today),
    })),
    signatureDataUrl: vault.signatureDataUrl,
    signedAt: vault.signedAt,
    monthsWeight,
  });
});

const commitmentInputSchema = z
  .object({
    // Si viene, es un compromiso EXISTENTE a actualizar (preserva su
    // check-in diario y su resultado final, ver WordCommitmentCheckIn en
    // schema.prisma); si no viene (o no es de este usuario), se crea nuevo.
    id: z.string().min(1).optional(),
    title: z.string().min(1),
    text: z.string().min(1),
    // YYYY-MM-DD: el "progreso" del Resumen es puramente el paso del tiempo
    // entre estas dos fechas (ver wordProgress.ts en el frontend), por eso
    // ambas son obligatorias — sin targetDate no hay nada que mostrar.
    startDate: z.string().min(1),
    targetDate: z.string().min(1),
    // Opcional: el formulario de /palabra no la edita (el selector vive en
    // la tarjeta del Resumen, ver PATCH de arriba) pero la reenvía tal cual
    // para no perderla al guardar.
    area: z.enum(HABIT_CATEGORIES).nullable().optional(),
  })
  .refine((c) => parseDateOnlyToUtcMidnight(c.targetDate) >= parseDateOnlyToUtcMidnight(c.startDate), {
    message: "La fecha objetivo no puede ser anterior a la de inicio",
  });

const saveCommitmentsSchema = z.object({
  pin: z.string(),
  items: z.array(commitmentInputSchema).max(20),
});

// PUT /api/word/commitments — guarda la lista completa, en el orden
// recibido, pero por ID (upsert) en vez de borrar-y-recrear: un compromiso
// que ya existía (trae `id`) se ACTUALIZA, uno nuevo (sin `id`) se crea, y
// el que ya no viene en la lista se borra (con sus check-ins/resultado, por
// `onDelete` por defecto de Prisma vía la transacción de abajo). Antes esto
// borraba y recreaba TODO en cada guardado — rompía la relación con
// WordCommitmentCheckIn (el check-in diario quedaría huérfano de un
// compromiso que ya no existe) cada vez que se editaba un texto.
router.put("/commitments", async (req, res) => {
  const parsed = saveCommitmentsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const vault = await getOrCreateVault(req.userId!);
  if (!vault.pinHash || !verifyPin(parsed.data.pin, vault.pinHash)) {
    res.status(401).json({ error: "PIN incorrecto" });
    return;
  }

  const existing = await prisma.wordCommitment.findMany({ where: { vaultId: vault.id }, select: { id: true } });
  const existingIds = new Set(existing.map((c) => c.id));

  let items: { id?: string; title: string; text: string; startDate: Date; targetDate: Date; area: string | null }[];
  try {
    items = parsed.data.items.map((c) => ({
      // Un `id` que no pertenece a este vault (ajeno, o typo del cliente) se
      // trata como compromiso nuevo — nunca se actualiza algo que no es de
      // quien pide.
      id: c.id && existingIds.has(c.id) ? c.id : undefined,
      title: c.title,
      text: c.text,
      startDate: parseDateOnlyToUtcMidnight(c.startDate),
      targetDate: parseDateOnlyToUtcMidnight(c.targetDate),
      area: c.area ?? null,
    }));
  } catch {
    res.status(400).json({ error: "Fecha inválida, se espera YYYY-MM-DD" });
    return;
  }

  const keptIds = new Set(items.map((i) => i.id).filter((id): id is string => !!id));
  const removedIds = existing.map((c) => c.id).filter((id) => !keptIds.has(id));

  await prisma.$transaction([
    prisma.wordCommitmentCheckIn.deleteMany({ where: { commitmentId: { in: removedIds } } }),
    prisma.wordCommitmentMonth.deleteMany({ where: { commitmentId: { in: removedIds } } }),
    prisma.wordCommitment.deleteMany({ where: { id: { in: removedIds } } }),
    ...items.map((item, index) =>
      item.id
        ? prisma.wordCommitment.update({
            where: { id: item.id },
            data: { title: item.title, text: item.text, startDate: item.startDate, targetDate: item.targetDate, area: item.area, sortOrder: index + 1 },
          })
        : prisma.wordCommitment.create({
            data: { vaultId: vault.id, title: item.title, text: item.text, startDate: item.startDate, targetDate: item.targetDate, area: item.area, sortOrder: index + 1 },
          }),
    ),
  ]);

  const commitments = await prisma.wordCommitment.findMany({
    where: { vaultId: vault.id },
    orderBy: { sortOrder: "asc" },
  });
  res.json(commitments.map(serializeCommitment));
});

const sealMonthSchema = z.object({ pin: z.string(), sealed: z.boolean(), today: z.string().regex(DATE_RE).optional() });

async function loadCommitmentWithMonths(id: string, vaultId: string) {
  return prisma.wordCommitment.findFirst({ where: { id, vaultId }, include: { months: true } });
}

// POST /api/word/commitments/:id/months/:monthIndex/seal — "¿Honraste tu
// palabra?" al cerrar un mes (Paso 2). Solo se puede responder un tramo que
// esté realmente "pendiente de cierre" ahora mismo (ver computeMonthStatus)
// y que todavía no tenga resolución — una vez resuelto, queda resuelto
// (mismo criterio que el viejo POST /result: nunca se pisa una respuesta).
router.post("/commitments/:id/months/:monthIndex/seal", async (req, res) => {
  const parsed = sealMonthSchema.safeParse(req.body);
  const monthIndex = Number(req.params.monthIndex);
  if (!parsed.success || !Number.isInteger(monthIndex) || monthIndex < 1) {
    res.status(400).json({ error: "Pedido inválido" });
    return;
  }

  const vault = await prisma.wordVault.findUnique({ where: { userId: req.userId! } });
  if (!vault?.pinHash || !verifyPin(parsed.data.pin, vault.pinHash)) {
    res.status(401).json({ error: "PIN incorrecto" });
    return;
  }

  const commitment = await loadCommitmentWithMonths(req.params.id, vault.id);
  if (!commitment) {
    res.status(404).json({ error: "Compromiso no encontrado" });
    return;
  }
  if (commitment.months.some((m) => m.monthIndex === monthIndex)) {
    res.status(409).json({ error: "Este mes ya tiene una resolución" });
    return;
  }

  const today = parseDateOnlyToUtcMidnight(parsed.data.today ?? todayLocalISO());
  const segments = deriveMonthSegments(commitment.startDate, commitment.targetDate);
  const segment = segments.find((s) => s.monthIndex === monthIndex);
  if (!segment || computeMonthStatus(segment, undefined, today) !== "pendiente_cierre") {
    res.status(409).json({ error: "Este mes todavía no está pendiente de cierre" });
    return;
  }

  await prisma.wordCommitmentMonth.create({ data: { commitmentId: commitment.id, monthIndex, sealed: parsed.data.sealed } });

  const updated = await loadCommitmentWithMonths(commitment.id, vault.id);
  const monthsWeight = (
    await prisma.wordCommitment.findMany({ where: { vaultId: vault.id }, include: { months: true } })
  ).reduce((sum, c) => sum + sealedCount(c.months), 0);

  res.json({ commitment: { ...serializeCommitment(updated!), ...buildMonthsInfo(updated!, today) }, monthsWeight });
});

const fallSchema = z.object({ pin: z.string(), today: z.string().regex(DATE_RE).optional() });

// POST /api/word/commitments/:id/fall — "Reportar una caída" (Paso 3),
// siempre sobre el tramo EN CURSO ahora mismo (nunca uno futuro ni uno ya
// terminado) — ese mes queda sin sello de una, sin esperar a que termine.
router.post("/commitments/:id/fall", async (req, res) => {
  const parsed = fallSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Falta el PIN" });
    return;
  }

  const vault = await prisma.wordVault.findUnique({ where: { userId: req.userId! } });
  if (!vault?.pinHash || !verifyPin(parsed.data.pin, vault.pinHash)) {
    res.status(401).json({ error: "PIN incorrecto" });
    return;
  }

  const commitment = await loadCommitmentWithMonths(req.params.id, vault.id);
  if (!commitment) {
    res.status(404).json({ error: "Compromiso no encontrado" });
    return;
  }

  const today = parseDateOnlyToUtcMidnight(parsed.data.today ?? todayLocalISO());
  const segments = deriveMonthSegments(commitment.startDate, commitment.targetDate);
  const segment = segments.find((s) => computeMonthStatus(s, undefined, today) === "en_curso");
  if (!segment) {
    res.status(409).json({ error: "No hay un mes en curso para este compromiso" });
    return;
  }
  if (commitment.months.some((m) => m.monthIndex === segment.monthIndex)) {
    res.status(409).json({ error: "Este mes ya tiene una resolución" });
    return;
  }

  await prisma.wordCommitmentMonth.create({
    data: { commitmentId: commitment.id, monthIndex: segment.monthIndex, sealed: false, fallReportedAt: new Date() },
  });

  const updated = await loadCommitmentWithMonths(commitment.id, vault.id);
  res.json({ ...serializeCommitment(updated!), ...buildMonthsInfo(updated!, today) });
});

const saveSignatureSchema = z.object({
  pin: z.string(),
  // PNG en base64 (data URL) dibujado en el canvas del frontend. El límite
  // generoso (3MB) es solo un piso de cordura, no una optimización — un
  // trazo de firma en PNG nunca se acerca a eso.
  signatureDataUrl: z.string().min(1).max(3_000_000).startsWith("data:image/"),
});

// PUT /api/word/signature — guarda (o reemplaza) la firma dibujada a mano.
// Firmar de nuevo pisa la anterior: no hay historial de firmas, es LA firma
// vigente de este documento, igual que en la vida real solo importa la
// última vez que alguien estampó su firma en un papel.
router.put("/signature", async (req, res) => {
  const parsed = saveSignatureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Falta la firma o el PIN" });
    return;
  }

  const vault = await getOrCreateVault(req.userId!);
  if (!vault.pinHash || !verifyPin(parsed.data.pin, vault.pinHash)) {
    res.status(401).json({ error: "PIN incorrecto" });
    return;
  }

  const updated = await prisma.wordVault.update({
    where: { id: vault.id },
    data: { signatureDataUrl: parsed.data.signatureDataUrl, signedAt: new Date() },
  });
  res.json({ signatureDataUrl: updated.signatureDataUrl, signedAt: updated.signedAt });
});

export default router;
