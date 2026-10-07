import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";

export type Insight =
  | {
      type: "weekday";
      habitId: string;
      habitName: string;
      weekdayLabel: string;
      rateOnWeekday: number;
      rateOverall: number;
      occurrences: number;
      summary: string;
    }
  | {
      type: "emotion";
      emotion: string;
      rateOnEmotionDays: number;
      rateOtherDays: number;
      occurrences: number;
      summary: string;
    }
  | {
      type: "habit_pair";
      habitAId: string;
      habitAName: string;
      habitBId: string;
      habitBName: string;
      coFailures: number;
      summary: string;
    };

export type InsightsResult = {
  enoughData: boolean;
  totalDays: number;
  minDays: number;
  insights: Insight[];
};

/**
 * Patrones detectados sobre TODA la historia (no el ciclo seleccionado en
 * /dashboard), por eso cachea aparte y no depende del cycleId. Cambia poco
 * de un día para otro — no vale la pena refetchear agresivo.
 */
export function useInsights() {
  return useQuery({
    queryKey: ["insights"],
    queryFn: () => apiFetch<InsightsResult>("/insights"),
    staleTime: 10 * 60 * 1000,
  });
}
