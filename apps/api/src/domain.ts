import { z } from "zod";

export const HABIT_MOMENTS = ["MANANA", "DIA", "NOCHE", "CIERRE_DEL_DIA"] as const;
export const HABIT_CATEGORIES = [
  "PRIORIDAD_MAXIMA",
  "SUPLEMENTO",
  "OPCIONAL",
  "HABITO_BASE",
  "CONDICIONAL",
  "AUTOCONOCIMIENTO",
] as const;
export const LOG_STATUSES = ["DONE", "PENDING", "NA"] as const;

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

export const habitMomentSchema = z.enum(HABIT_MOMENTS);
export const habitCategorySchema = z.enum(HABIT_CATEGORIES);
export const logStatusSchema = z.enum(LOG_STATUSES);
export const emotionSchema = z.enum(EMOTIONS);
export const librarySectionSchema = z.enum(LIBRARY_SECTIONS);

export type HabitMoment = (typeof HABIT_MOMENTS)[number];
export type HabitCategory = (typeof HABIT_CATEGORIES)[number];
export type LogStatus = (typeof LOG_STATUSES)[number];
export type Emotion = (typeof EMOTIONS)[number];
export type LibrarySection = (typeof LIBRARY_SECTIONS)[number];
export type LibrarySource = (typeof LIBRARY_SOURCES)[number];
