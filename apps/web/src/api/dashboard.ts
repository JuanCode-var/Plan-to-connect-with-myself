import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { HabitCategory, HabitPriorityLevel, LogStatus } from "../domain";

export type CycleSummary = {
  cycle: { id: string; name: string; startDate: string; endDate: string };
  totals: { done: number; pending: number; na: number };
  /** % de cumplimiento general, ya excluyendo `NA` — 0..1. */
  completionRate: number;
  counters: {
    noBettingDays: number;
    noAlcoholDays: number;
    trainingDays: number;
    studyDays: number;
    emotionalLogDays: number;
  };
  byHabit: Array<{
    id: string;
    name: string;
    category: HabitCategory;
    priority: HabitPriorityLevel;
    completionRate: number;
  }>;
  /** Solo los días ya transcurridos del ciclo (ver services/tracking.ts). */
  byDay: Array<{ date: string; completionRate: number }>;
  /** Historial crudo (sin agregar) habitId+fecha+estado del ciclo — lo usa
   * "Sinergias" (Resonancia del ciclo, ver components/CycleResonance/) para
   * cruzar qué hábitos se cumplieron el mismo día entre sí. */
  habitLogs: Array<{ id: string; habitId: string; cycleId: string; date: string; status: LogStatus }>;
};

export type CycleComparisonEntry = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  completionRate: number;
  /** % por hábito de ESE ciclo — lo necesita "Versiones de ti" (Resonancia del ciclo) para el % por área histórico. */
  byHabit: Array<{ id: string; name: string; category: HabitCategory; priority: HabitPriorityLevel; completionRate: number }>;
  /** `false` = el ciclo existe pero no tiene un solo HabitLog registrado — "tarjeta fantasma" de Versiones de ti, nunca un % inventado. */
  hasData: boolean;
};

/**
 * GET /api/dashboard/:cycleId. `enabled: !!cycleId` porque el ciclo por
 * defecto (el activo) se resuelve de forma asíncrona desde `useCycles()` en
 * la página — hasta entonces no hay nada que pedir.
 */
export function useCycleSummary(cycleId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", "summary", cycleId],
    queryFn: () => apiFetch<CycleSummary>(`/dashboard/${cycleId}`),
    enabled: !!cycleId,
  });
}

/** GET /api/dashboard/compare — ya viene ordenado por `startDate` asc. */
export function useCycleComparison() {
  return useQuery({
    queryKey: ["dashboard", "compare"],
    queryFn: () => apiFetch<CycleComparisonEntry[]>("/dashboard/compare"),
  });
}
