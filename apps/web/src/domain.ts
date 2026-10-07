export const HABIT_MOMENTS = ["MANANA", "DIA", "NOCHE", "CIERRE_DEL_DIA"] as const;
export type HabitMoment = (typeof HABIT_MOMENTS)[number];

// Área de vida del hábito, independiente de su urgencia (ver
// HABIT_PRIORITY_LEVELS más abajo: antes un solo campo de 6 valores
// mezclaba ambos conceptos).
export const HABIT_CATEGORIES = ["FISICO", "ECONOMICO", "MENTAL", "EMOCIONAL", "HABILIDADES", "ESPIRITUAL"] as const;
export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

export const LOG_STATUSES = ["DONE", "PENDING", "NA"] as const;
export type LogStatus = (typeof LOG_STATUSES)[number];

// Estado de una Meta (ver pages/Metas.tsx): PENDIENTE = todavía sin
// arrancar, EN_PROGRESO = con al menos un paso tildado o avance anotado,
// CUMPLIDA = lograda (ahí cobra sentido el campo `celebration`).
export const GOAL_STATUSES = ["PENDIENTE", "EN_PROGRESO", "CUMPLIDA"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  CUMPLIDA: "Cumplida",
};

// Mismo criterio de 3 hues distintos que HABIT_PRIORITY_COLORS, pero esta
// paleta es propia de Metas (no reutiliza esa) porque mide otra cosa: acá no
// es urgencia, es fase del ciclo de vida de la meta.
export const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  PENDIENTE: "#6B7280",
  EN_PROGRESO: "var(--accent)",
  CUMPLIDA: "#16A34A",
};

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
// Color propio para la sección "Qué agradezco" del Diario — distinto del
// violeta de insight/reflexión (ver comentario arriba), un tono cálido para
// algo que por naturaleza es más cálido/positivo que una reflexión neutra.
export const GRATITUDE_COLOR = "#EC4899";

export const PIN_DURATIONS = ["DAY", "WEEK", "MONTH"] as const;
export type PinDuration = (typeof PIN_DURATIONS)[number];
export const PIN_DURATION_LABELS: Record<PinDuration, string> = {
  DAY: "Un día",
  WEEK: "Una semana",
  MONTH: "Un mes",
};

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
  FISICO: "Físico",
  ECONOMICO: "Económico",
  MENTAL: "Mental",
  EMOCIONAL: "Emocional",
  HABILIDADES: "Habilidades",
  ESPIRITUAL: "Espiritual",
};

// Urgencia del hábito, campo independiente de la categoría (área de vida):
// un hábito de cualquier área puede ser alta, media o baja urgencia — ya no
// se deriva de la categoría, se elige a mano al crear/editar el hábito.
export const HABIT_PRIORITY_LEVELS = ["ALTA", "MEDIA", "BAJA"] as const;
export type HabitPriorityLevel = (typeof HABIT_PRIORITY_LEVELS)[number];

export const HABIT_PRIORITY_LABELS: Record<HabitPriorityLevel, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

// Un color por NIVEL de prioridad: alta = rojo (hacer primero, urgente),
// media = el dorado de marca de la app (el grueso de la rutina diaria),
// baja = teal frío (se puede saltear, a propósito distinto en temperatura de
// los otros dos). Tres hues bien distintos entre sí — no una escala
// monocromática — para que se puedan diferenciar de un vistazo, tanto en el
// ícono de PriorityIcon (CategoryBadge, TrackerMatrix) como en los anillos
// "por prioridad" de TodayProgress y los gráficos del Resumen.
export const HABIT_PRIORITY_COLORS: Record<HabitPriorityLevel, string> = {
  ALTA: "#DC2626",
  MEDIA: "var(--accent)",
  BAJA: "#0D9488",
};
