import type { PillarKey } from "../../api/compass";

export type PillarMeta = { key: PillarKey; glyph: string; name: string; question: string; tone: string };

export const PILLARS: PillarMeta[] = [
  { key: "autoconocimiento", glyph: "◎", name: "Autoconocimiento", question: "¿Quién soy cuando nadie me lo pide?", tone: "rgb(167,139,250)" },
  { key: "valores", glyph: "◇", name: "Valores", question: "¿Qué defiendo, aunque cueste?", tone: "rgb(129,140,248)" },
  { key: "proposito", glyph: "✦", name: "Propósito", question: "¿Para qué hago todo esto?", tone: "rgb(232,121,249)" },
];

export const PILLAR_PHRASE_TO: Record<PillarKey, string> = {
  autoconocimiento: "Autoconocimiento",
  valores: "Valores",
  proposito: "Propósito",
};

/** Frase exacta al sellar cada pilar (umbral, mockup 18e). */
export const SEAL_PHRASE: Record<PillarKey, string> = {
  autoconocimiento: "Te conoces. Eso ya es una ventaja.",
  valores: "Sabes lo que defiendes. Eso te hace predecible para ti mismo.",
  proposito: "Tienes una dirección. Eso ya es más de lo que tiene la mayoría.",
};

export function splitLines(text: string | null | undefined): string[] {
  return (text ?? "").split("\n").map((v) => v.trim()).filter(Boolean);
}

const STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "a", "en", "y", "o", "u",
  "que", "con", "por", "para", "lo", "mi", "me", "se", "su", "sus", "es", "soy", "ser", "estoy", "esta",
  "este", "esto", "nunca", "deseo", "quiero", "cuando", "nadie", "pide", "no", "sin", "más", "mas",
]);

function normalize(word: string): string {
  return word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .split(/\s+/)
      .map(normalize)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

/**
 * "ECO": qué ítems de `compareItems` (fortalezas/valores, texto corto cada
 * uno) también aparecen como palabra real dentro de `sourceText` — nunca
 * inventado, solo coincidencia literal de palabras (ignorando artículos muy
 * comunes). Devuelve [] si no hay ningún match real — no se muestra nada en
 * ese caso (pedido explícito: no fabricar un eco donde no lo hay).
 */
export function findEcoMatches(sourceText: string | null | undefined, compareItems: string[]): string[] {
  if (!sourceText) return [];
  const sourceWords = tokenize(sourceText);
  return compareItems.filter((item) => {
    const itemWords = tokenize(item);
    if (itemWords.size === 0) return false;
    for (const w of itemWords) {
      if (sourceWords.has(w)) return true;
    }
    return false;
  });
}

export function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}
