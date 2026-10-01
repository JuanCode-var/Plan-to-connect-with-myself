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

export const LIBRARY_SECTIONS = ["LIBRO", "FRASE", "FILOSOFIA"] as const;
export type LibrarySection = (typeof LIBRARY_SECTIONS)[number];

export const LIBRARY_SECTION_LABELS: Record<LibrarySection, string> = {
  LIBRO: "Libros",
  FRASE: "Frases",
  FILOSOFIA: "Filosofías",
};

// Mismo criterio que HABIT_PRIORITY_COLORS más abajo: un color por tipo de
// contenido, usado como franja de acento en las tarjetas "mosaico" de la
// Biblioteca. El violeta es un tono nuevo en la paleta — antes "insight /
// reflexión" (Frases acá, Conocimientos del Diario) no tenía color propio.
export const LIBRARY_SECTION_COLORS: Record<LibrarySection, string> = {
  LIBRO: "var(--accent)",
  FILOSOFIA: "#0D9488",
  FRASE: "#8B5CF6",
};
export const INSIGHT_COLOR = "#8B5CF6";

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

export const HABIT_PRIORITY_LEVELS = ["ALTA", "MEDIA", "BAJA"] as const;
export type HabitPriorityLevel = (typeof HABIT_PRIORITY_LEVELS)[number];

// Nivel de prioridad real del hábito (no el "tipo"): PRIORIDAD_MAXIMA es
// alta; HABITO_BASE, CONDICIONAL y AUTOCONOCIMIENTO son media (el registro
// emocional pesa más que un suplemento, aunque no sea "innegociable" como la
// prioridad máxima); SUPLEMENTO y OPCIONAL son baja.
export const HABIT_CATEGORY_PRIORITY: Record<HabitCategory, HabitPriorityLevel> = {
  PRIORIDAD_MAXIMA: "ALTA",
  HABITO_BASE: "MEDIA",
  CONDICIONAL: "MEDIA",
  AUTOCONOCIMIENTO: "MEDIA",
  SUPLEMENTO: "BAJA",
  OPCIONAL: "BAJA",
};

// Un color por NIVEL de prioridad (no por categoría — las 6 categorías caen
// en solo 3 colores, ver HABIT_CATEGORY_PRIORITY): alta = rojo (hacer
// primero, urgente), media = el dorado de marca de la app (el grueso de la
// rutina diaria), baja = teal frío (se puede saltear, a propósito distinto
// en temperatura de los otros dos). Tres hues bien distintos entre sí — no
// una escala monocromática — para que se puedan diferenciar de un vistazo,
// tanto en el ícono de PriorityIcon (CategoryBadge, TrackerMatrix) como en
// los anillos "por prioridad" de TodayProgress y los gráficos del Resumen.
export const HABIT_PRIORITY_COLORS: Record<HabitPriorityLevel, string> = {
  ALTA: "#DC2626",
  MEDIA: "var(--accent)",
  BAJA: "#0D9488",
};
