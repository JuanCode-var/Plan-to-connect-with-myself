// "Máximo un cuadro de '¿cómo lo aplicaste?' por día" por cada `scopeKey`
// (pedido explícito original: si hay varios hábitos Mental sin vínculo
// explícito, completarlos todos el mismo día no debe preguntar una vez por
// cada uno — el aprendizaje sugerido por ÁREA es el mismo para todos, así
// que una sola vez alcanza — de ahí `area:${category}` como key en ese caso).
// Un aprendizaje vinculado A MANO a un hábito puntual es otra cosa (cada
// hábito linkeado tiene su PROPIO aprendizaje, no "lo mismo" repetido), así
// que ese caso usa `habit:${habitId}` — permite un cuadro por cada hábito
// linkeado distinto el mismo día, sin volver a romper el límite de arriba.
// Mismo patrón de throttle en localStorage que wasMessageShownToday/
// markMessageShownToday en compassTriggers.ts, pero con su propia key: es
// otro dominio (Micro acciones, no Mi Identidad), no vale la pena acoplarlos
// solo porque comparten la forma.
function throttleKey(scopeKey: string, todayISO: string): string {
  return `apply-learning:${scopeKey}:${todayISO}`;
}

export function wasApplyLearningShownToday(scopeKey: string, todayISO: string): boolean {
  try {
    return localStorage.getItem(throttleKey(scopeKey, todayISO)) === "1";
  } catch {
    return false;
  }
}

export function markApplyLearningShownToday(scopeKey: string, todayISO: string): void {
  try {
    localStorage.setItem(throttleKey(scopeKey, todayISO), "1");
  } catch {
    // Cortesía, no garantía — ver mismo comentario en compassTriggers.ts.
  }
}
