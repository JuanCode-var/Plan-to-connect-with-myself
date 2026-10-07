import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { HabitCategory, HabitPriorityLevel } from "../domain";

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
};

export type CycleComparisonEntry = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  completionRate: number;
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
