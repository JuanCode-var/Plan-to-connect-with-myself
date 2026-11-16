function lowerFirst(text: string): string {
  return text.length > 0 ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

/** "Si Si siento" (Paso 6 del rediseño de Micro acciones): el label "SI…"
 * ya dice "Si", así que si el texto del usuario también empieza con "Si "
 * se le saca ese prefijo antes de mostrarlo — nunca se guarda así en la
 * base, es solo para mostrar. */
export function cleanPlanIf(raw: string): string {
  return lowerFirst(raw.replace(/^si\s+/i, ""));
}

export type SplitPlanThen = { main: string; twoMinuteNote: string | null };

/** ".," (Paso 6) + separa "versión de 2 minutos" como nota aparte si el
 * usuario la escribió pegada al final con una coma — misma limpieza para
 * cualquier lugar que muestre o reutilice `planThen` (WoopView.tsx,
 * HabitIdentityGrid.tsx al prellenar un hábito desde un plan WOOP). */
export function splitPlanThen(raw: string): SplitPlanThen {
  const cleaned = raw.replace(/\.,/g, ".");
  const match = cleaned.match(/^(.*?)[.,]?\s*,?\s*versión de 2 minutos\s*\.?$/i);
  if (match && match[1].trim()) {
    const main = match[1].trim().replace(/[.,]+$/, "");
    return { main: `${main}.`, twoMinuteNote: "Versión de 2 minutos." };
  }
  return { main: cleaned.trim(), twoMinuteNote: null };
}
