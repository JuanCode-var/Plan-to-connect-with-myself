import type { Identity, Weakness } from "../api/compass";

/**
 * Textos de las intervenciones de "Mi Brújula" — todo en un solo lugar a
 * propósito, para poder revisar de un vistazo que ninguno genere culpa ni
 * vergüenza (regla explícita del pedido original: "el ideal se usa como
 * recordatorio, nunca como reproche"). Si no hay identidad vinculada al
 * hábito, cae a la primera frase de "Mi ideal" general (si existe) — nunca
 * a un mensaje genérico de stock.
 */

function fallbackIdentity(identities: Identity[]): Identity | undefined {
  return identities[0];
}

export function buildOverdueMessage(habitName: string, linked: Identity | undefined, identities: Identity[]): string {
  const identity = linked ?? fallbackIdentity(identities);
  if (identity) {
    return `"${identity.statement}" — y "${habitName}" todavía te está esperando hoy.`;
  }
  return `"${habitName}" todavía te está esperando hoy.`;
}

export function buildPostponedMessage(linked: Identity | undefined, minimalVersion: string | null): string {
  const parts: string[] = [];
  if (linked?.why) parts.push(linked.why);
  if (minimalVersion) parts.push(`¿Vale la versión chica de hoy? ${minimalVersion}`);
  if (parts.length === 0) {
    return "Hoy no, y está bien — mañana sigue en pie.";
  }
  return parts.join(" ");
}

export function buildStreakBrokenMessage(habitName: string): string {
  return `Se cortó una racha en "${habitName}". Hoy es un buen día para retomarla, sin drama.`;
}

/**
 * El "mensaje a mí mismo" real es el contramensaje que el usuario se
 * escribió para una debilidad puntual (Autoconocimiento) — no un campo
 * suelto. Se usa la primera debilidad que tenga contramensaje cargado; si
 * ninguna lo tiene todavía, cae al mismo fallback genérico de siempre.
 */
export function buildInterruptionMessage(weaknesses: Weakness[]): string {
  const withMessage = weaknesses.find((w) => w.counterMessage?.trim());
  return withMessage?.counterMessage?.trim() || "Llevas un par de días sin poder con esto. No pasa nada — ¿qué se interpuso?";
}
