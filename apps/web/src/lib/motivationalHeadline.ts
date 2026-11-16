/** Mensaje calibrado a lo que realmente se logró en el ciclo — no un genérico
 * "¡bien hecho!" siempre igual. Extraído de Dashboard.tsx para que
 * CycleResonance/CycleLoadRing.tsx (Resonancia del ciclo) lo reutilice tal
 * cual ("la frase motivacional... la actual", pedido explícito) en vez de
 * duplicar los 5 tramos a mano. */
export function motivationalHeadline(rate: number, totalDone: number, name: string | undefined): string {
  const who = name ? `, ${name}` : "";
  if (totalDone === 0) return `Este ciclo recién empieza${who} — cada hábito marcado es el primer ladrillo.`;
  if (rate >= 0.9) return `Impecable${who}. Estás dominando este ciclo de punta a punta.`;
  if (rate >= 0.7) return `Vas muy sólido${who}. Este nivel de constancia es el que compone con el tiempo.`;
  if (rate >= 0.4) return `Estás construyendo algo real${who} — cada marca en verde suma más de lo que parece.`;
  return `Todavía hay ciclo por delante${who}. Un hábito hoy ya cambia la tendencia.`;
}
