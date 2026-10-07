import type { NextFunction, Request, Response } from "express";
import { verifySessionToken } from "../lib/session";

declare global {
  namespace Express {
    interface Request {
      /** Seteado por `requireAuth`; siempre presente en cualquier ruta donde
       * este middleware corrió primero (todas menos /api/auth). */
      userId?: string;
    }
  }
}

/**
 * Gatekeeper de todas las rutas de datos (hábitos, ciclos, logs, diario,
 * metas, biblioteca, insights, dashboard). Antes de esto, `routes/auth.ts`
 * solo abría la puerta del FRONTEND (RequireAuth.tsx redirigía a /login si
 * no había token) — la API en sí no verificaba nada, así que cualquiera con
 * la URL de un endpoint podía leer o escribir los datos de cualquier
 * cuenta. Este middleware es lo que realmente hace cumplir el aislamiento
 * por cuenta: cuelga `req.userId` para que cada ruta filtre sus lecturas y
 * estampe sus escrituras con el dueño correcto.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  const session = token ? verifySessionToken(token) : null;
  if (!session) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  req.userId = session.userId;
  next();
}
