import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import { showToast } from "../lib/toast";
import type { GoalStatus } from "../domain";

export type GoalStep = {
  id: string;
  goalId: string;
  description: string;
  done: boolean;
  sortOrder: number;
  createdAt: string;
};

export type Goal = {
  id: string;
  cycleId: string;
  title: string;
  why: string | null;
  visualization: string | null;
  specification: string;
  targetDate: string;
  status: GoalStatus;
  followUpNotes: string | null;
  celebration: string | null;
  sortOrder: number;
  createdAt: string;
  steps: GoalStep[];
};

function goalsQueryKey(cycleId: string | undefined) {
  return ["goals", cycleId] as const;
}

export function useGoals(cycleId: string | undefined) {
  return useQuery({
    queryKey: goalsQueryKey(cycleId),
    queryFn: () => apiFetch<Goal[]>(`/goals?cycleId=${cycleId}`),
    enabled: !!cycleId,
  });
}

type CreateGoalInput = {
  cycleId: string;
  title: string;
  why?: string;
  visualization?: string;
  specification: string;
  targetDate: string;
};

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGoalInput) =>
      apiFetch<Goal>("/goals", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (goal) => queryClient.invalidateQueries({ queryKey: goalsQueryKey(goal.cycleId) }),
  });
}

type UpdateGoalInput = {
  id: string;
  cycleId: string;
  data: Partial<
    Pick<Goal, "title" | "why" | "visualization" | "specification" | "targetDate" | "status" | "followUpNotes" | "celebration">
  >;
};

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateGoalInput) =>
      apiFetch<Goal>(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: (_goal, { cycleId }) => queryClient.invalidateQueries({ queryKey: goalsQueryKey(cycleId) }),
  });
}

export function useDeleteGoal(cycleId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueryKey(cycleId) }),
  });
}

export function useCreateGoalStep(cycleId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, description }: { goalId: string; description: string }) =>
      apiFetch<GoalStep>(`/goals/${goalId}/steps`, { method: "POST", body: JSON.stringify({ description }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueryKey(cycleId) }),
  });
}

/**
 * Tildar/destildar un paso: optimista (mismo criterio que useSetLogStatus en
 * api/tracking.ts) porque es la interacción más frecuente de toda la
 * pantalla de Metas — el checklist de la fase 4/paso 3 de Tracy se usa todos
 * los días, no debería sentirse más lento que marcar un hábito en /tracker.
 */
export function useToggleGoalStep(cycleId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = goalsQueryKey(cycleId);

  return useMutation({
    mutationFn: ({ goalId, stepId, done }: { goalId: string; stepId: string; done: boolean }) =>
      apiFetch<GoalStep>(`/goals/${goalId}/steps/${stepId}`, {
        method: "PATCH",
        body: JSON.stringify({ done }),
      }),

    onMutate: async ({ goalId, stepId, done }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Goal[]>(queryKey);

      queryClient.setQueryData<Goal[]>(queryKey, (old) =>
        old?.map((goal) =>
          goal.id !== goalId
            ? goal
            : { ...goal, steps: goal.steps.map((s) => (s.id === stepId ? { ...s, done } : s)) },
        ),
      );

      return { previous };
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      showToast("No se pudo guardar el cambio. Se revirtió el paso.");
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useDeleteGoalStep(cycleId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, stepId }: { goalId: string; stepId: string }) =>
      apiFetch<void>(`/goals/${goalId}/steps/${stepId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueryKey(cycleId) }),
  });
}
