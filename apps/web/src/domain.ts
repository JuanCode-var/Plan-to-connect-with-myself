export const HABIT_MOMENTS = ["MANANA", "DIA", "NOCHE", "CIERRE_DEL_DIA"] as const;
export type HabitMoment = (typeof HABIT_MOMENTS)[number];

export const HABIT_CATEGORIES = [
  "PRIORIDAD_MAXIMA",
  "SUPLEMENTO",
  "OPCIONAL",
  "HABITO_BASE",
  "CONDICIONAL",
  "AUTOCONOCIMIENTO",
] as const;
export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

export const LOG_STATUSES = ["DONE", "PENDING", "NA"] as const;
export type LogStatus = (typeof LOG_STATUSES)[number];

export const EMOTIONS = [
  "Ansiedad",
  "Tristeza",
  "Vacío",
  "Agotamiento",
  "Frustración",
  "Culpa",
  "Desmotivación",
  "Otra",
] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const HABIT_MOMENT_LABELS: Record<HabitMoment, string> = {
  MANANA: "Mañana",
  DIA: "Día",
  NOCHE: "Noche",
  CIERRE_DEL_DIA: "Cierre del día",
};

export const HABIT_CATEGORY_LABELS: Record<HabitCategory, string> = {
  PRIORIDAD_MAXIMA: "Prioridad máxima",
  SUPLEMENTO: "Suplemento",
  OPCIONAL: "Opcional",
  HABITO_BASE: "Hábito base",
  CONDICIONAL: "Condicional",
  AUTOCONOCIMIENTO: "Autoconocimiento",
};

export const HABIT_CATEGORY_COLORS: Record<
  HabitCategory,
  { chipBg: string; chipText: string; rowTint: string }
> = {
  // Color por nivel de prioridad real del hábito (no por tipo): alta =
  // índigo, media = teal, baja = naranja (el mismo acento de marca que ya
  // usa el resto de la app para "Hoy", rachas y celebraciones — no se
  // introduce un cuarto color solo para esta escala). PRIORIDAD_MAXIMA es
  // alta; HABITO_BASE, CONDICIONAL y AUTOCONOCIMIENTO son media (el
  // registro emocional pesa más que un suplemento, aunque no sea
  // "innegociable" como la prioridad máxima); SUPLEMENTO y OPCIONAL son baja.
  PRIORIDAD_MAXIMA: { chipBg: "#4338CA", chipText: "#FFFFFF", rowTint: "#A5B4FC" },
  HABITO_BASE: { chipBg: "#0D9488", chipText: "#FFFFFF", rowTint: "#5EEAD4" },
  CONDICIONAL: { chipBg: "#0D9488", chipText: "#FFFFFF", rowTint: "#5EEAD4" },
  AUTOCONOCIMIENTO: { chipBg: "#0D9488", chipText: "#FFFFFF", rowTint: "#5EEAD4" },
  SUPLEMENTO: { chipBg: "#EA580C", chipText: "#FFFFFF", rowTint: "#FED7AA" },
  OPCIONAL: { chipBg: "#EA580C", chipText: "#FFFFFF", rowTint: "#FED7AA" },
};
