import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// scrypt del propio Node en vez de bcrypt/argon2: evita sumar una
// dependencia nueva solo para esto. El salt va concatenado al hash
// ("salt:derivado", ambos en hex) para no necesitar una columna aparte.
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;

  const derived = scryptSync(password, salt, KEY_LENGTH);
  const keyBuffer = Buffer.from(key, "hex");
  // timingSafeEqual exige buffers del mismo largo; si no coinciden, el hash
  // guardado está corrupto o es de otro formato — tratarlo como no válido
  // en vez de tirar una excepción.
  if (derived.length !== keyBuffer.length) return false;
  return timingSafeEqual(derived, keyBuffer);
}
