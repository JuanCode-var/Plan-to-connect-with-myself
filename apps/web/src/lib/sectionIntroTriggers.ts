// "Entendido, no mostrar más" del resumen de cada sección (SectionIntro.tsx)
// — a diferencia de applyLearningTriggers.ts/dailyReviewTriggers.ts, que se
// resetean cada día, este dismiss es permanente por sección (una vez leído,
// no vuelve a molestar). Mismo patrón de localStorage con try/catch
// silencioso: es una cortesía de UI de este dispositivo, no una garantía.
function key(id: string): string {
  return `section-intro-dismissed:${id}`;
}

export function wasSectionIntroDismissed(id: string): boolean {
  try {
    return localStorage.getItem(key(id)) === "1";
  } catch {
    return false;
  }
}

export function dismissSectionIntro(id: string): void {
  try {
    localStorage.setItem(key(id), "1");
  } catch {
    // Cortesía, no garantía — ver comentario de arriba.
  }
}
