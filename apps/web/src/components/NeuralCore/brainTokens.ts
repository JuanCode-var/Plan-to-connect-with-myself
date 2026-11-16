import type { HabitCategory } from "../../domain";

/** Las 6 áreas reales (`habit.category`) → región cerebral, color y función corta. */
export type BrainArea = "men" | "emo" | "fis" | "esp" | "eco" | "hab";

export const AREA_OF_CATEGORY: Record<HabitCategory, BrainArea> = {
  MENTAL: "men",
  EMOCIONAL: "emo",
  FISICO: "fis",
  ESPIRITUAL: "esp",
  ECONOMICO: "eco",
  HABILIDADES: "hab",
};

export const BRAIN_AREAS: BrainArea[] = ["men", "emo", "fis", "esp", "eco", "hab"];

/** Inverso de AREA_OF_CATEGORY — para filtrar /habits?area={key} por categoría real. */
export const CATEGORY_OF_AREA: Record<BrainArea, HabitCategory> = {
  men: "MENTAL",
  emo: "EMOCIONAL",
  fis: "FISICO",
  esp: "ESPIRITUAL",
  eco: "ECONOMICO",
  hab: "HABILIDADES",
};

export function isBrainArea(value: string): value is BrainArea {
  return (BRAIN_AREAS as string[]).includes(value);
}

export const BRAIN_AREA_LABEL: Record<BrainArea, string> = {
  men: "Mental",
  emo: "Emocional",
  fis: "Física",
  esp: "Espiritual",
  eco: "Económica",
  hab: "Habilidades",
};

export const BRAIN_REGION_LABEL: Record<BrainArea, string> = {
  men: "Lóbulo frontal",
  emo: "Lóbulo temporal · límbico",
  fis: "Cerebelo y corteza motora",
  esp: "Ínsula",
  eco: "Lóbulo parietal",
  hab: "Lóbulo occipital",
};

export const BRAIN_REGION_NAME: Record<BrainArea, string> = {
  men: "Frontal",
  emo: "Temporal",
  fis: "Cerebelo",
  esp: "Ínsula",
  eco: "Parietal",
  hab: "Occipital",
};

export const BRAIN_FUNCTION_LABEL: Record<BrainArea, string> = {
  men: "Atención y planificación",
  emo: "Emociones y memoria",
  fis: "Coordinación y movimiento",
  esp: "Conciencia interior y calma",
  eco: "Números y cálculo",
  hab: "Aprender observando",
};

export const BRAIN_AREA_COLOR: Record<BrainArea, string> = {
  men: "#38BDF8",
  emo: "#FB5C8C",
  fis: "#34D399",
  esp: "#FBBF24",
  eco: "#A78BFA",
  hab: "#FB923C",
};

/** Variante oscura de cada color de área — para degradados (p. ej. las mini-portadas de "Alimento para tu cerebro", Biblioteca). */
export const BRAIN_AREA_DARK_COLOR: Record<BrainArea, string> = {
  men: "#0C4A6E",
  emo: "#7C2D55",
  fis: "#065F46",
  esp: "#78350F",
  eco: "#3B2A78",
  hab: "#7C2D12",
};

export const BRAIN_AREA_RGB: Record<BrainArea, string> = {
  men: "56,189,248",
  emo: "251,92,140",
  fis: "52,211,153",
  esp: "251,191,36",
  eco: "167,139,250",
  hab: "251,146,60",
};

/** Centroides de cada región (coordenadas del SVG del cerebro, viewBox 0 0 600 480). */
export const BRAIN_CENTROID: Record<BrainArea, { x: number; y: number }> = {
  men: { x: 170, y: 170 },
  emo: { x: 330, y: 290 },
  fis: { x: 455, y: 372 },
  esp: { x: 255, y: 242 },
  eco: { x: 390, y: 118 },
  hab: { x: 498, y: 255 },
};

/** Frase de identidad al subir de etapa de mielina (sección 6 del pedido). */
export const BRAIN_IDENTITY_PHRASE: Record<BrainArea, string> = {
  men: "Ya eres alguien que se enfoca.",
  emo: "Ya eres alguien que se escucha.",
  fis: "Ya eres alguien que se mueve.",
  esp: "Ya eres alguien que se conecta consigo.",
  eco: "Ya eres alguien que cuida su dinero.",
  hab: "Ya eres alguien que domina lo que practica.",
};

/** "Dato real" por región (sección 8 del pedido). */
export const BRAIN_FACT: Record<BrainArea, { text: string; source: string }> = {
  men: {
    text: "La corteza prefrontal sostiene la atención, la planificación y el autocontrol. Es de las últimas regiones en terminar de madurar, hacia los 25 años.",
    source: "Gogtay et al., 2004, PNAS",
  },
  emo: {
    text: "La amígdala y el hipocampo están en la cara interna del lóbulo temporal. Ponerle nombre a lo que sientes reduce la activación de la amígdala.",
    source: "Lieberman et al., 2007, Psychological Science",
  },
  fis: {
    text: "El cerebelo coordina y automatiza el movimiento. Además, un año de ejercicio aeróbico aumentó cerca de 2% el volumen del hipocampo en adultos mayores.",
    source: "Erickson et al., 2011, PNAS",
  },
  esp: {
    text: "La ínsula procesa las señales internas del cuerpo. En personas con años de meditación se observó mayor grosor cortical en la ínsula y zonas prefrontales.",
    source: "Lazar et al., 2005, NeuroReport",
  },
  eco: {
    text: "El surco intraparietal participa en el procesamiento de cantidades y números, la base del cálculo que usas al manejar tu dinero.",
    source: "Dehaene et al., 2003, Cognitive Neuropsychology",
  },
  hab: {
    text: "El lóbulo occipital procesa lo que ves. Al aprender a leer, una zona occipitotemporal se especializa en reconocer palabras escritas: el cerebro se reorganiza con la práctica.",
    source: "Dehaene y Cohen, 2011, Trends in Cognitive Sciences",
  },
};

// Mielinización (sección 6): etapas acumulativas de impulsosDeVida por área.
// "Autopista" se renombró a "Consolidado" (pedido explícito) — mismo cian,
// mismo umbral, solo cambia el nombre.
export type MyelinStage = "Chispa" | "Sendero" | "Consolidado" | "Automático";
const MYELIN_THRESHOLDS: Array<{ min: number; stage: MyelinStage }> = [
  { min: 180, stage: "Automático" },
  { min: 90, stage: "Consolidado" },
  { min: 30, stage: "Sendero" },
  { min: 0, stage: "Chispa" },
];
export function myelinStage(lifetimeImpulses: number): MyelinStage {
  return MYELIN_THRESHOLDS.find((t) => lifetimeImpulses >= t.min)!.stage;
}

// Estados del núcleo (sección 5): umbrales de % sobre el máximo del día.
export type CoreStateKey = "latente" | "despertar" | "enfoque" | "flow" | "pleno";
export const CORE_STATES: Array<{
  key: CoreStateKey;
  minPercent: number;
  label: string;
  description: string;
  color: string;
}> = [
  { key: "latente", minPercent: 0, label: "Latente", description: "tu núcleo espera el primer impulso", color: "#A9B1D6" },
  { key: "despertar", minPercent: 29, label: "Despertar", description: "tu cerebro está encendido", color: "#22D3EE" },
  { key: "enfoque", minPercent: 58, label: "Enfoque", description: "tus circuitos trabajan en sincronía", color: "#38BDF8" },
  { key: "flow", minPercent: 87, label: "Flow", description: "estás en tu mejor versión de hoy", color: "#A78BFA" },
  { key: "pleno", minPercent: 100, label: "Núcleo pleno", description: "día cerrado a plena carga", color: "#FDE68A" },
];
export function coreStateFor(percent: number): (typeof CORE_STATES)[number] {
  let result = CORE_STATES[0];
  for (const s of CORE_STATES) {
    if (percent >= s.minPercent) result = s;
  }
  return result;
}
