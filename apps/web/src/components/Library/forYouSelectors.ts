import { BRAIN_AREAS, type BrainArea } from "../NeuralCore/brainTokens";

/**
 * "PARA TI HOY" (Fase 1, punto 3b) — mismo espíritu que doseSelector.ts:
 * el área con menor % del ciclo, mirando SOLO las áreas que de verdad
 * tienen al menos un libro asignado (nunca "recomienda" un área vacía). Si
 * esa área tiene más de un libro, prefiere uno todavía no leído.
 */
export type BookCandidate = { id: string; area: BrainArea | null; status: "NUEVO" | "EN_PROGRESO" | "LEIDO" };

export function selectBookForYou(byAreaPercent: Partial<Record<BrainArea, number | null>>, books: BookCandidate[]): { bookId: string; area: BrainArea } | null {
  const areasWithBooks = BRAIN_AREAS.filter((area) => books.some((b) => b.area === area));
  if (areasWithBooks.length === 0) return null;

  const percentOf = (area: BrainArea) => byAreaPercent[area] ?? 0;
  const bestArea = areasWithBooks.reduce((best, area) => (percentOf(area) < percentOf(best) ? area : best), areasWithBooks[0]);

  const candidates = books.filter((b) => b.area === bestArea);
  const notRead = candidates.filter((b) => b.status !== "LEIDO");
  const chosen = (notRead.length > 0 ? notRead : candidates)[0];

  return { bookId: chosen.id, area: bestArea };
}

/**
 * "FRASE DEL DÍA" — una frase estable durante todo el día (mismo hash todo
 * el día de hoy, distinto mañana), determinista a partir de la fecha, nunca
 * `Math.random()`. `quotes` debe llegar en un orden ESTABLE (p. ej. por id)
 * para que la rotación tenga sentido día a día.
 */
export function pickDailyQuote<T extends { id: string }>(quotes: T[], dateISO: string): T | null {
  if (quotes.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < dateISO.length; i++) {
    hash = (hash * 31 + dateISO.charCodeAt(i)) >>> 0;
  }
  return quotes[hash % quotes.length];
}
