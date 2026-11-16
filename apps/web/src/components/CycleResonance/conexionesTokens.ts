import type { BrainArea } from "../NeuralCore/brainTokens";
import { HABIT_STRENGTH_LEVELS, type HabitStrengthKey } from "./resonanceTokens";

/**
 * "Mapa de conexiones" — puerto de Conexiones.dc.html. Reutiliza
 * BRAIN_AREA_COLOR/BRAIN_AREA_RGB/BRAIN_AREA_LABEL (brainTokens.ts, mismos 6
 * colores que el mockup define en su objeto AREAS) y HABIT_STRENGTH_LEVELS
 * (resonanceTokens.ts, mismas 5 etapas/colores/umbrales que TIERS) — no se
 * duplica ninguno de esos valores acá.
 *
 * Lo único nuevo de esta pantalla: el ORDEN de los sectores (RING_ORDER,
 * distinto del orden de AreaBalanceHexagon.tsx) y, por cada etapa de fuerza,
 * su RADIO de anillo (TIER_RADIUS) y su mensaje largo (TIER_MESSAGE) — ninguno
 * de los dos existía todavía porque ninguna pantalla anterior dibujaba anillos
 * concéntricos ni mostraba este texto.
 */
export const RING_ORDER: BrainArea[] = ["men", "esp", "emo", "eco", "fis", "hab"];

export const MAP_W = 900;
export const MAP_H = 840;
export const MAP_CX = 450;
export const MAP_CY = 420;
export const HUB_R = 140;
export const CORE_R = 50;
export const SECTOR_R = 410;

export const TIER_RADIUS: Record<HabitStrengthKey, number> = {
  automatico: 192,
  consolidado: 246,
  sendero: 298,
  chispa: 347,
  poda: 392,
};

export const TIER_MESSAGE: Record<HabitStrengthKey, string> = {
  automatico: "Conexión automática: ya no te cuesta fuerza de voluntad. Es parte de quien eres.",
  consolidado: "Consolidado: transmite rápido y casi siempre. Protégela en tus días difíciles y estará en Automático pronto.",
  sendero: "Sendero: el camino ya se marca, pero todavía pide intención. Unos días seguidos más la acercan al núcleo.",
  chispa: "Chispa: la conexión existe, pero cuesta. Atarla a un hábito ancla (mira Sinergias) es la forma más rápida de fortalecerla.",
  poda: "En poda: el cerebro atenúa lo que no usa, pero no lo borra. Decide si la reactivas o la pasas a reposo para que no pese en tu carga.",
};

/** De adentro hacia afuera (Automático primero) — orden inverso a HABIT_STRENGTH_LEVELS, que va de "En poda" a "Automático". */
export const TIERS_DESC = [...HABIT_STRENGTH_LEVELS].reverse();
