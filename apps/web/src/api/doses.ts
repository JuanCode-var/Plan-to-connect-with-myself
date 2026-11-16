import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HabitCategory } from "../domain";
import { apiFetch } from "./client";

export type Dose = {
  id: string;
  title: string;
  area: HabitCategory;
  sourceEntry: { id: string; title: string | null; author: string | null } | null;
  sourceSchool: { id: string; name: string } | null;
  hookTemplate: string;
  hookQuestion: string;
  hookOptionsJson: string;
  hookAnswer: string;
  guessQuestion: string;
  guessMin: number;
  guessMax: number;
  guessStep: number;
  guessRealValue: number;
  guessExplanation: string;
  holdInstruction: string;
  holdCompletionText: string;
  rewardEntry: { id: string; content: string; author: string | null };
  actionsJson: string;
  sortOrder: number;
};

export type DoseProgress = { id: string; doseId: string; date: string; completedAt: string };

export function parseDoseOptions(dose: Pick<Dose, "hookOptionsJson">): string[] {
  try {
    const parsed = JSON.parse(dose.hookOptionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export type DoseAction = { text: string; detail: string };

export function parseDoseActions(dose: Pick<Dose, "actionsJson">): DoseAction[] {
  try {
    const parsed = JSON.parse(dose.actionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useDoses() {
  return useQuery({
    queryKey: ["doses"],
    queryFn: () => apiFetch<Dose[]>("/doses"),
    staleTime: 60 * 1000,
  });
}

/** Historial COMPLETO de dosis completadas por el usuario (no solo la de hoy) — hace falta para la racha y para reciclar (ver doseSelector.ts). */
export function useDoseProgress() {
  return useQuery({
    queryKey: ["doses", "progress"],
    queryFn: () => apiFetch<DoseProgress[]>("/doses/progress"),
  });
}

export type UnlockRewardResult = { entryId: string; unlockedCount: number; totalQuotes: number };

/** Paso 4 ("TU RECOMPENSA") — idempotente del lado del server (upsert), se puede llamar de nuevo sin romper nada. */
export function useUnlockDoseReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (doseId: string) => apiFetch<UnlockRewardResult>(`/doses/${doseId}/unlock-reward`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library", "unlocked-quotes"] }),
  });
}

export type CompleteDoseResult = { microAction: { id: string; text: string } };

/** Paso 5 ("HOY LO PRUEBO") — crea la micro acción elegida y registra la dosis como completada hoy (racha). */
export function useCompleteDose() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ doseId, actionIndex, date }: { doseId: string; actionIndex: number; date: string }) =>
      apiFetch<CompleteDoseResult>(`/doses/${doseId}/complete`, { method: "POST", body: JSON.stringify({ actionIndex, date }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doses", "progress"] });
      queryClient.invalidateQueries({ queryKey: ["microActions"] });
      queryClient.invalidateQueries({ queryKey: ["learnings"] });
    },
  });
}
