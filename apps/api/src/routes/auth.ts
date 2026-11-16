import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { sendPasswordResetEmail } from "../lib/email";
import { hashPassword, verifyPassword } from "../lib/password";
import { createSessionToken, verifySessionToken } from "../lib/session";

const router = Router();

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function publicUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Ya existe una cuenta con ese email" });
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash: hashPassword(parsed.data.password),
    },
  });

  res.status(201).json({ token: createSessionToken(user.id), user: publicUser(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  // Mismo mensaje genérico tanto si el email no existe como si la
  // contraseña es incorrecta — no confirmar si un email está registrado.
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    res.status(401).json({ error: "Email o contraseña incorrectos" });
    return;
  }

  res.json({ token: createSessionToken(user.id), user: publicUser(user) });
});

const forgotPasswordSchema = z.object({ email: z.string().email() });

/**
 * Nunca confirma si el email está registrado o no (mismo criterio que
 * /login con "Email o contraseña incorrectos" genérico) — responde igual
 * en los dos casos, para no filtrar qué emails tienen cuenta acá.
 */
router.post("/forgot-password", async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: hashResetToken(token),
        resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const appUrl = process.env.APP_URL ?? "http://localhost:8080";
    await sendPasswordResetEmail(user.email, `${appUrl}/reset-password?token=${token}`);
  }

  res.json({ message: "Si el email está registrado, te enviamos un enlace para recuperar tu contraseña." });
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

// Token de un solo uso: se limpia de la fila apenas se consume, sea para
// crear la nueva contraseña o si se pide un token nuevo (lo reemplaza).
router.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const user = await prisma.user.findUnique({ where: { resetTokenHash: hashResetToken(parsed.data.token) } });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    res.status(400).json({ error: "El enlace no es válido o ya venció. Pedí uno nuevo." });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword(parsed.data.newPassword),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });

  res.json({ token: createSessionToken(updated.id), user: publicUser(updated) });
});

router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  const session = token ? verifySessionToken(token) : null;
  if (!session) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  res.json(publicUser(user));
});

export default router;
