import type { CatalogHabit, CatalogStage } from "../api/habits";
import { AREA_OF_CATEGORY, type BrainArea } from "../components/NeuralCore/brainTokens";
import { NEURAL_TEXT_SECONDARY } from "../components/NeuralCore/tokens";
import type { HabitCategory } from "../domain";

/** Mismas 6 etapas de siempre (ver catalogStageFor en el backend) — única
 * fuente de etiqueta/color para HabitRow.tsx (Por momento del día) y
 * HabitDetailPanel.tsx (el panel de detalle compartido por las 2 vistas). */
export const CATALOG_STAGE_LABEL: Record<CatalogStage, string> = {
  nuevo: "Nuevo",
  poda: "En poda",
  chispa: "Chispa",
  sendero: "Sendero",
  consolidado: "Consolidado",
  automatico: "Automático",
};

export const CATALOG_STAGE_COLOR: Record<CatalogStage, string> = {
  nuevo: NEURAL_TEXT_SECONDARY,
  poda: "#64748B",
  chispa: "#E6E9F5",
  sendero: "#C4B5FD",
  consolidado: "#22D3EE",
  automatico: "#FDE68A",
};

/**
 * "Hábitos por identidad" (mockups 16e-16i): nombres de región tal como los
 * pidió el mockup — más cortos que BRAIN_REGION_LABEL de brainTokens.ts
 * (ese es el de Mapa Neuronal/Cerebro Interactivo, con otra redacción para
 * esas pantallas — "Corteza frontal" acá, "Lóbulo frontal" allá). Mismo
 * criterio que DIARIO_WEEKDAY_LABELS: una sección puntual con su propio
 * texto fijo, sin forzar un constante compartida a decir algo que no pidió.
 */
export const IDENTITY_REGION_LABEL: Record<HabitCategory, string> = {
  MENTAL: "Corteza frontal",
  ECONOMICO: "Lóbulo parietal",
  HABILIDADES: "Lóbulo occipital",
  EMOCIONAL: "Lóbulo temporal",
  FISICO: "Cerebelo",
  ESPIRITUAL: "Ínsula",
};

/** Orden fijo pedido para la rejilla 3x2 (Paso 4). */
export const IDENTITY_AREA_ORDER: HabitCategory[] = ["MENTAL", "ECONOMICO", "HABILIDADES", "EMOCIONAL", "FISICO", "ESPIRITUAL"];

const STRONG_THRESHOLD = 85;

export type RegionStrength = { category: HabitCategory; area: BrainArea; percent: number | null };

/**
 * Fuerza de una región = promedio del % (últimos 30 días, ya lo trae
 * CatalogHabit) de sus hábitos ACTIVOS — sin pausados. `null` = "Sin
 * encender" (ningún hábito activo en esa área). Pedido explícito del
 * usuario como cálculo PROPIO de esta vista, distinto del brillo de Mapa
 * Neuronal/Cerebro Interactivo (que es impulsos de por vida + decaimiento,
 * confirmado con el usuario antes de construir esto — ver Paso 6).
 */
export function regionStrengthByArea(habits: CatalogHabit[]): Record<HabitCategory, RegionStrength> {
  const result = {} as Record<HabitCategory, RegionStrength>;
  for (const category of IDENTITY_AREA_ORDER) {
    const active = habits.filter((h) => h.category === category && h.active);
    const percent = active.length === 0 ? null : Math.round(active.reduce((sum, h) => sum + h.percent, 0) / active.length);
    result[category] = { category, area: AREA_OF_CATEGORY[category], percent };
  }
  return result;
}

export function regionsEncendidasCount(strengths: Record<HabitCategory, RegionStrength>): number {
  return Object.values(strengths).filter((s) => s.percent !== null).length;
}

export type IdentityPhrase = { habitId: string; category: HabitCategory; area: BrainArea; phrase: string; percent: number };

/**
 * "Ya eres alguien que…" — hasta 3 hábitos ACTIVOS con `meConvierteEn` y
 * fuerza ≥85%, el más fuerte primero. Única fuente para esta frase en toda
 * la app (Paso 6): Mi Identidad (CompassAchievements.tsx) la consume desde
 * acá también, en vez de tener su propio cálculo aparte.
 */
export function topIdentityPhrases(habits: CatalogHabit[], max = 3): IdentityPhrase[] {
  return habits
    .filter((h) => h.active && h.meConvierteEn && h.percent >= STRONG_THRESHOLD)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, max)
    .map((h) => ({ habitId: h.id, category: h.category, area: AREA_OF_CATEGORY[h.category], phrase: h.meConvierteEn!, percent: h.percent }));
}

/**
 * "Te estás convirtiendo en alguien que…" — el hábito ACTIVO con
 * `meConvierteEn` más débil, priorizando prioridad ALTA (si hay alguno); si
 * ninguno de prioridad alta tiene frase, el más débil entre TODOS los que sí
 * tienen. `null` si ningún hábito activo tiene `meConvierteEn` todavía.
 */
export function weakestIdentityPhrase(habits: CatalogHabit[]): IdentityPhrase | null {
  const withPhrase = habits.filter((h) => h.active && h.meConvierteEn);
  if (withPhrase.length === 0) return null;

  const highPriority = withPhrase.filter((h) => h.priority === "ALTA");
  const pool = highPriority.length > 0 ? highPriority : withPhrase;
  const weakest = pool.reduce((a, b) => (b.percent < a.percent ? b : a));
  return { habitId: weakest.id, category: weakest.category, area: AREA_OF_CATEGORY[weakest.category], phrase: weakest.meConvierteEn!, percent: weakest.percent };
}

/** El primer hábito activo SIN `meConvierteEn` todavía — para el botón "Empezar" del estado vacío del hero (Paso 2). */
export function firstHabitWithoutPhrase(habits: CatalogHabit[]): CatalogHabit | null {
  return habits.find((h) => h.active && !h.meConvierteEn) ?? null;
}
