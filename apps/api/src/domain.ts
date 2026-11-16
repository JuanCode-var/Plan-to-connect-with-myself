import { z } from "zod";

export const HABIT_MOMENTS = ["MANANA", "DIA", "NOCHE", "CIERRE_DEL_DIA"] as const;
// Área de vida del hábito (antes esto mezclaba urgencia y área en un solo
// campo de 6 valores: PRIORIDAD_MAXIMA/SUPLEMENTO/OPCIONAL/HABITO_BASE/
// CONDICIONAL/AUTOCONOCIMIENTO). Ahora son dos campos independientes: esta
// es el área ("¿de qué parte de mi vida es esto?"), HABIT_PRIORITIES de
// abajo es la urgencia ("¿qué tan importante es resolverlo hoy?").
export const HABIT_CATEGORIES = ["FISICO", "ECONOMICO", "MENTAL", "EMOCIONAL", "HABILIDADES", "ESPIRITUAL"] as const;
export const HABIT_PRIORITIES = ["ALTA", "MEDIA", "BAJA"] as const;
export const LOG_STATUSES = ["DONE", "PENDING", "NA"] as const;

// Rediseño "Diario" (Núcleo Neural, mockups 17-17g): 10 emociones fijas con
// color propio (ver EMOTION_COLORS en apps/web/src/domain.ts) en vez de la
// lista vieja separada en "negativas"/"positivas". Entradas viejas con una
// emoción que ya no está acá (ej. "Agotamiento", "Entusiasmo", "Otra")
// siguen existiendo tal cual en la base — nunca se remapean solas a una
// emoción nueva, eso sería inventar un dato que la persona no escribió — y
// el frontend las muestra igual, solo sin un color mapeado (cae a un gris
// neutro).
export const EMOTIONS = [
  "Alegría",
  "Calma",
  "Gratitud",
  "Orgullo",
  "Esperanza",
  "Ansiedad",
  "Tristeza",
  "Frustración",
  "Enojo",
  "Cansancio",
] as const;

export const LIBRARY_SECTIONS = ["LIBRO", "FRASE", "FILOSOFIA"] as const;
export const LIBRARY_SOURCES = ["SEED", "USER"] as const;
export const PIN_DURATIONS = ["DAY", "WEEK", "MONTH"] as const;

// "Micro acciones": de dónde salió una MicroAction (a mano, del cuadro de
// "¿cómo lo aplicaste?", o de la Revisión del día) y qué tipo de respuesta
// es una LearningApplication del diario.
export const MICRO_ACTION_ORIGINS = ["MANUAL", "APPLICATION", "REVIEW", "PROPOSITO"] as const;
export const APPLICATION_TYPES = ["APPLIED", "WILL_APPLY"] as const;

export const habitMomentSchema = z.enum(HABIT_MOMENTS);
export const habitCategorySchema = z.enum(HABIT_CATEGORIES);
export const habitPrioritySchema = z.enum(HABIT_PRIORITIES);
export const logStatusSchema = z.enum(LOG_STATUSES);
export const emotionSchema = z.enum(EMOTIONS);
export const librarySectionSchema = z.enum(LIBRARY_SECTIONS);
export const pinDurationSchema = z.enum(PIN_DURATIONS);
export const microActionOriginSchema = z.enum(MICRO_ACTION_ORIGINS);
export const applicationTypeSchema = z.enum(APPLICATION_TYPES);

export type HabitMoment = (typeof HABIT_MOMENTS)[number];
export type HabitCategory = (typeof HABIT_CATEGORIES)[number];
export type HabitPriority = (typeof HABIT_PRIORITIES)[number];
export type LogStatus = (typeof LOG_STATUSES)[number];
export type Emotion = (typeof EMOTIONS)[number];
export type LibrarySection = (typeof LIBRARY_SECTIONS)[number];
export type LibrarySource = (typeof LIBRARY_SOURCES)[number];
export type PinDuration = (typeof PIN_DURATIONS)[number];
export type MicroActionOrigin = (typeof MICRO_ACTION_ORIGINS)[number];
export type ApplicationType = (typeof APPLICATION_TYPES)[number];
