import type { HabitCategory } from "../domain";

/**
 * Sugerencia de área (HabitCategory) para un compromiso de "Mi Palabra" a
 * partir de palabras clave en su título/texto — solo un PUNTO DE PARTIDA: el
 * usuario la puede cambiar desde la tarjeta de "Circuitos en recableado"
 * (ver PATCH /word/commitments/:id/area). El orden de esta lista importa: la
 * primera categoría cuyo patrón matchea gana, así que las más específicas
 * (alcohol/apuestas como EMOCIONAL, no ECONOMICO aunque "gastar" ronde el
 * tema) van primero.
 */
const AREA_KEYWORDS: Array<{ category: HabitCategory; patterns: RegExp[] }> = [
  { category: "EMOCIONAL", patterns: [/alcohol/i, /beber/i, /apuesta/i, /apostar/i, /ansiedad/i, /emocion/i] },
  { category: "ECONOMICO", patterns: [/ahorr/i, /dinero/i, /deuda/i, /gast/i, /financ/i, /plata/i] },
  { category: "FISICO", patterns: [/ejercicio/i, /entren/i, /dormir/i, /sueño/i, /salud/i, /comer/i, /aliment/i, /peso/i] },
  { category: "ESPIRITUAL", patterns: [/medit/i, /gratitud/i, /espiritual/i, /oraci/i, /consciencia/i] },
  { category: "MENTAL", patterns: [/estudi/i, /enfoque/i, /concentr/i, /leer/i, /celular/i, /pantalla/i, /foco/i] },
  { category: "HABILIDADES", patterns: [/practicar/i, /aprender/i, /habilidad/i, /curso/i, /proyecto/i, /destreza/i] },
];

export function suggestCommitmentArea(title: string, text: string): HabitCategory | null {
  const haystack = `${title} ${text}`;
  for (const { category, patterns } of AREA_KEYWORDS) {
    if (patterns.some((p) => p.test(haystack))) return category;
  }
  return null;
}

/**
 * ¿Este compromiso describe lo mismo que ya mide un contador de abstinencia
 * existente (días sin alcohol/apuestas, ver RewireCard.tsx en
 * CerebroDelCicloTab.tsx)? Si coincide, la tarjeta del compromiso REEMPLAZA
 * a la del contador (pedido explícito: nunca mostrar los dos a la vez para
 * lo mismo) — devuelve cuál, o `null` si no coincide con ninguno.
 */
export function matchesExistingCounter(title: string, text: string): "alcohol" | "apuestas" | null {
  const haystack = `${title} ${text}`;
  if (/alcohol|beber|tomar( alcohol)?/i.test(haystack)) return "alcohol";
  if (/apuesta|apostar/i.test(haystack)) return "apuestas";
  return null;
}
