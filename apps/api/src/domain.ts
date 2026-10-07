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
export const GOAL_STATUSES = ["PENDIENTE", "EN_PROGRESO", "CUMPLIDA"] as const;

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

export const LIBRARY_SECTIONS = ["LIBRO", "FRASE", "FILOSOFIA"] as const;
export const LIBRARY_SOURCES = ["SEED", "USER"] as const;
export const PIN_DURATIONS = ["DAY", "WEEK", "MONTH"] as const;

export const habitMomentSchema = z.enum(HABIT_MOMENTS);
export const habitCategorySchema = z.enum(HABIT_CATEGORIES);
export const habitPrioritySchema = z.enum(HABIT_PRIORITIES);
export const logStatusSchema = z.enum(LOG_STATUSES);
export const goalStatusSchema = z.enum(GOAL_STATUSES);
export const emotionSchema = z.enum(EMOTIONS);
export const librarySectionSchema = z.enum(LIBRARY_SECTIONS);
export const pinDurationSchema = z.enum(PIN_DURATIONS);

export type HabitMoment = (typeof HABIT_MOMENTS)[number];
export type HabitCategory = (typeof HABIT_CATEGORIES)[number];
export type HabitPriority = (typeof HABIT_PRIORITIES)[number];
export type LogStatus = (typeof LOG_STATUSES)[number];
export type GoalStatus = (typeof GOAL_STATUSES)[number];
export type Emotion = (typeof EMOTIONS)[number];
export type LibrarySection = (typeof LIBRARY_SECTIONS)[number];
export type LibrarySource = (typeof LIBRARY_SOURCES)[number];
export type PinDuration = (typeof PIN_DURATIONS)[number];
