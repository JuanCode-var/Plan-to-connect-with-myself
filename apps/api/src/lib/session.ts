import { createHmac, timingSafeEqual } from "node:crypto";

// Token de sesión "casero" (payload + firma HMAC, ambos base64url) en vez de
// sumar la dependencia `jsonwebtoken` solo para esto — incluso está sin
// estado (no hay tabla de sesiones que limpiar). `SESSION_SECRET` debería
// configurarse en producción; el valor por defecto alcanza para desarrollo
// local de una app personal de un solo usuario.
const SECRET = process.env.SESSION_SECRET ?? "dr-axon-dev-secret-cambiar-en-produccion";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 90; // 90 días

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): { userId: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const decoded: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof (decoded as { userId?: unknown }).userId !== "string" ||
      typeof (decoded as { iat?: unknown }).iat !== "number"
    ) {
      return null;
    }
    const { userId, iat } = decoded as { userId: string; iat: number };
    if (Date.now() - iat > MAX_AGE_MS) return null;
    return { userId };
  } catch {
    return null;
  }
}
