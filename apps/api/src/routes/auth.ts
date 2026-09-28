import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { hashPassword, verifyPassword } from "../lib/password";
import { createSessionToken, verifySessionToken } from "../lib/session";

const router = Router();

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
