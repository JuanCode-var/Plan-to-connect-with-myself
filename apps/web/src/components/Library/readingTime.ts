const WORDS_PER_MINUTE = 200;

/** Minutos de lectura estimados a ~200 palabras/minuto (pedido explícito) — mínimo 1 minuto para cualquier texto no vacío. */
export function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  return Math.max(1, Math.round(words.length / WORDS_PER_MINUTE));
}
