/**
 * "Resonancia del ciclo" — rediseño de "Resumen de hábitos" (Dashboard.tsx)
 * con la identidad visual del Cerebro Neural. Pedido explícito: reutilizar
 * los tokens del Cerebro Neural donde ya existan, no duplicarlos. Los
 * siguientes YA EXISTEN y se importan directo donde haga falta, no se
 * reexportan desde acá:
 *   - Fondo/tarjeta/texto/tipografías/`scale()` → ../NeuralCore/tokens.ts
 *     (NEURAL_BG, NEURAL_CARD_BG, NEURAL_VIOLET_CARD_BORDER, NEURAL_CARD_SHADOW,
 *     NEURAL_TEXT, NEURAL_TEXT_SOFT, NEURAL_TEXT_SECONDARY, NEURAL_LAVENDER,
 *     NEURAL_FONT_DISPLAY, NEURAL_FONT_BODY — valores idénticos a los
 *     pedidos acá, confirmado antes de escribir este archivo).
 *   - Colores de las 6 áreas de vida → ../NeuralCore/brainTokens.ts
 *     (BRAIN_AREA_COLOR, BRAIN_AREA_RGB, BRAIN_AREA_LABEL, BRAIN_AREAS,
 *     AREA_OF_CATEGORY — mismos 6 valores hex pedidos acá, ya mapeados
 *     1:1 a HabitCategory).
 *
 * Lo que sigue es NUEVO — no existía en el Cerebro Neural, porque describe
 * cosas distintas aunque compartan la forma (umbrales por %):
 *   - RESONANCE_STATES: estado del DÍA o del CICLO según su % de
 *     cumplimiento. Comparte los mismos 5 umbrales (29/58/87/100) que
 *     CORE_STATES en brainTokens.ts, pero ESE describe los impulsos de HOY
 *     en el Cerebro Interactivo — esto describe cualquier día o ciclo
 *     completo del historial. Además el primer estado tiene otro color acá
 *     (#FB5C8C "Apagón", no #A9B1D6 "Latente") — por eso es un tipo
 *     separado, no una reutilización con el color pisado.
 *   - HABIT_STRENGTH_LEVELS: nuevo concepto, no existía — qué tan afianzado
 *     está un hábito dentro del ciclo según su % de cumplimiento (distinto
 *     de MyelinStage en brainTokens.ts, que mide impulsosDeVida acumulados
 *     de por vida, no un % de un ciclo puntual).
 */
export type ResonanceStateKey = "apagon" | "despertar" | "enfoque" | "flow" | "pleno";

export const RESONANCE_STATES: Array<{
  key: ResonanceStateKey;
  minPercent: number;
  label: string;
  color: string;
}> = [
  { key: "apagon", minPercent: 0, label: "Latente / Apagón", color: "#FB5C8C" },
  { key: "despertar", minPercent: 29, label: "Despertar", color: "#22D3EE" },
  { key: "enfoque", minPercent: 58, label: "Enfoque", color: "#38BDF8" },
  { key: "flow", minPercent: 87, label: "Flow", color: "#A78BFA" },
  { key: "pleno", minPercent: 100, label: "Pleno", color: "#FDE68A" },
];

/** `percent` en 0..100. Mismo criterio de escaneo que `coreStateFor` en brainTokens.ts: el último umbral que cumple gana. */
export function resonanceStateFor(percent: number): (typeof RESONANCE_STATES)[number] {
  let result = RESONANCE_STATES[0];
  for (const s of RESONANCE_STATES) {
    if (percent >= s.minPercent) result = s;
  }
  return result;
}

/** Primer umbral de RESONANCE_STATES todavía no alcanzado por `percent` (0..100) — null si ya está en Pleno. Usado por el anillo (muescas) y "Próximo disparo" (CycleLoadRing.tsx/NextTriggerCard.tsx), un solo lugar para no derivar el mismo cálculo dos veces. */
export function nextResonanceThreshold(percent: number): (typeof RESONANCE_STATES)[number] | null {
  return RESONANCE_STATES.find((s) => s.minPercent > percent) ?? null;
}

// Clasificación de UN DÍA puntual (Electroencefalograma, EEGChart.tsx) —
// pedido explícito: exactamente 4 bandas (Latente <29, Despertar 29-58,
// Enfoque 58-87, Flow 87-100), sin la 5ª banda "Pleno" (100%) que sí separa
// RESONANCE_STATES a nivel de CICLO completo. Mismos objetos (mismo color,
// mismo label) que los primeros 4 de RESONANCE_STATES — un día en exactamente
// 100% cae en "Flow" acá, no en un "Pleno" que esta pantalla no distingue.
export const DAY_STATES = RESONANCE_STATES.slice(0, 4);

export function dayStateFor(percent: number): (typeof DAY_STATES)[number] {
  let result = DAY_STATES[0];
  for (const s of DAY_STATES) {
    if (percent >= s.minPercent) result = s;
  }
  return result;
}

export type HabitStrengthKey = "poda" | "chispa" | "sendero" | "consolidado" | "automatico";

export const HABIT_STRENGTH_LEVELS: Array<{
  key: HabitStrengthKey;
  minPercent: number;
  label: string;
  color: string;
  dashed?: boolean;
}> = [
  { key: "poda", minPercent: 0, label: "En poda", color: "#64748B", dashed: true },
  { key: "chispa", minPercent: 30, label: "Chispa", color: "#E6E9F5" },
  { key: "sendero", minPercent: 60, label: "Sendero", color: "#C4B5FD" },
  { key: "consolidado", minPercent: 85, label: "Consolidado", color: "#22D3EE" },
  { key: "automatico", minPercent: 100, label: "Automático", color: "#FDE68A" },
];

/** `percent` en 0..100 — % de cumplimiento del hábito DENTRO del ciclo (no impulsosDeVida de por vida). */
export function habitStrengthFor(percent: number): (typeof HABIT_STRENGTH_LEVELS)[number] {
  let result = HABIT_STRENGTH_LEVELS[0];
  for (const s of HABIT_STRENGTH_LEVELS) {
    if (percent >= s.minPercent) result = s;
  }
  return result;
}
