import { BRAIN_AREAS, type BrainArea } from "../NeuralCore/brainTokens";
import type { ResonanceArea } from "./useCycleResonance";

/**
 * "Versiones de ti" — toda la aritmética de la pantalla vive acá, separada
 * del render, porque es exactamente la parte donde "nunca inventes números"
 * importa: con qué área se arma la frase de identidad, el cierre proyectado,
 * la meta de la próxima versión y los valores del cerebro de "en diseño".
 * Probado en versionesLogic.test.ts con 1 solo ciclo y con 3 simulados (pedido
 * explícito del usuario: "la prueba... SOLO en un test, no en la UI" — nunca
 * un modo "con historial de ejemplo" en producción).
 */

function percentOf(areas: ResonanceArea[], area: BrainArea): number | null {
  return areas.find((a) => a.area === area)?.percent ?? null;
}

/**
 * El área con mayor crecimiento respecto del ciclo anterior — o, si no hay
 * ciclo anterior real con qué comparar (primer ciclo registrado), la
 * "autopista del ciclo" (el área más fuerte de este ciclo). Ignora áreas sin
 * hábitos (`percent: null`): no se puede decir que "crecieron" ni que son
 * "la autopista" si no tienen ninguna conexión real. `null` si NINGÚN área
 * tiene hábitos todavía.
 */
export function identityGrowthArea(current: ResonanceArea[], previous: ResonanceArea[] | null): BrainArea | null {
  const candidates = BRAIN_AREAS.filter((area) => percentOf(current, area) !== null);
  if (candidates.length === 0) return null;

  if (!previous) {
    return candidates.reduce((best, area) => (percentOf(current, area)! > percentOf(current, best)! ? area : best));
  }

  const delta = (area: BrainArea) => percentOf(current, area)! - (percentOf(previous, area) ?? 0);
  return candidates.reduce((best, area) => (delta(area) > delta(best) ? area : best));
}

/**
 * Cierre proyectado del ciclo activo (sección 3 del pedido): combina el %
 * ya logrado en lo transcurrido con el promedio de los últimos días para
 * estimar cómo cerraría si ese ritmo se mantiene. `totalDays <= 0` o
 * `elapsedDays <= 0` devuelve `percentNow` tal cual (nada que proyectar
 * todavía) en vez de dividir por cero.
 */
export function projectedClose(percentNow: number, elapsedDays: number, last14Avg: number, totalDays: number): number {
  if (totalDays <= 0 || elapsedDays <= 0) return Math.round(percentNow);
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  return Math.round((percentNow * elapsedDays + last14Avg * remainingDays) / totalDays);
}

/** Meta realista para la próxima versión (sección 6): +12 puntos (tope 95%), o 40% si el área todavía no tiene hábitos (arranca de cero). */
export function goalForArea(currentPercent: number | null): number {
  return currentPercent ? Math.min(95, currentPercent + 12) : 40;
}

/**
 * Valores del mini cerebro de la tarjeta "EN DISEÑO" (sección 4): el área
 * elegida se muestra en su meta aspiracional (al menos 85%, nunca más bajo
 * que lo que ya tiene); el resto se atenúa al 55% de su valor actual. Un área
 * sin hábitos que no es la elegida sigue sin hábitos (`null`) — atenuar "nada"
 * no la convierte en un valor inventado.
 */
export function futureAreaPercents(current: ResonanceArea[], focusArea: BrainArea): Record<BrainArea, number | null> {
  const result = {} as Record<BrainArea, number | null>;
  for (const area of BRAIN_AREAS) {
    const now = percentOf(current, area);
    result[area] = area === focusArea ? Math.max(85, now ?? 0) : now === null ? null : now * 0.55;
  }
  return result;
}

/** Opacidad de relleno del mini cerebro (sección 1): `.08 + .62×%área`; `ghost` (tarjeta "SIN DATOS") la deja casi invisible sin importar el % que tendría. */
export function areaFillOpacity(percent: number | null, ghost = false): number {
  if (ghost) return 0.02;
  if (!percent) return 0.04;
  return Math.round((0.08 + 0.62 * (percent / 100)) * 100) / 100;
}

/** Un área se dibuja punteada cuando no tiene hábitos o están en 0% — nunca inventa un trazo sólido para una conexión que no existe. */
export function isAreaDashed(percent: number | null): boolean {
  return !percent;
}

/** Delta de % general entre dos tarjetas consecutivas (las flechas de la fila) — `null` si cualquiera de los dos lados no tiene dato real. */
export function overallDelta(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  return Math.round(current - previous);
}
