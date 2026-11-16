import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { HabitCategory } from "../domain";

export type Goal = {
  id: string;
  cycleId: string;
  title: string;
  area: HabitCategory | null;
  why: string | null;
  visualization: string | null;
  targetCount: number;
  unit: string;
  targetDate: string;
  progress: number;
  achievedAt: string | null;
  sortOrder: number;
  createdAt: string;
};

export type GoalIdea = {
  key: string;
  area: HabitCategory | null;
  title: string;
  kind: "woop" | "word" | "microaction";
  closesOn: string | null;
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

export function useGoalIdeas(cycleId: string | undefined) {
  return useQuery({
    queryKey: ["goals", "ideas", cycleId],
    queryFn: () => apiFetch<GoalIdea[]>(`/goals/ideas?cycleId=${cycleId}`),
    enabled: !!cycleId,
  });
}

export type CreateGoalInput = {
  cycleId: string;
  title: string;
  area: HabitCategory;
  why?: string;
  visualization?: string;
  targetCount: number;
  unit: string;
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
  data: Partial<Pick<Goal, "title" | "area" | "why" | "visualization" | "targetCount" | "unit" | "targetDate">>;
};

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateGoalInput) =>
      apiFetch<Goal>(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: (_goal, { cycleId }) => queryClient.invalidateQueries({ queryKey: goalsQueryKey(cycleId) }),
  });
}

/**
 * "+1 · Registrar avance" y "Restar 1" del menú ⋯ — optimista (mismo
 * criterio que useToggleGoalStep antes, useSetLogStatus en api/tracking.ts):
 * es la interacción más frecuente de toda la pantalla, no debería sentirse
 * más lenta que marcar un hábito en /tracker.
 */
export function useRegisterGoalProgress(cycleId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = goalsQueryKey(cycleId);

  return useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: 1 | -1 }) =>
      apiFetch<Goal>(`/goals/${id}/progress`, { method: "POST", body: JSON.stringify({ delta }) }),

    onMutate: async ({ id, delta }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Goal[]>(queryKey);

      queryClient.setQueryData<Goal[]>(queryKey, (old) =>
        old?.map((goal) => {
          if (goal.id !== id) return goal;
          const progress = Math.max(0, goal.progress + delta);
          const achieved = progress >= goal.targetCount;
          return { ...goal, progress, achievedAt: achieved ? (goal.achievedAt ?? new Date().toISOString()) : null };
        }),
      );

      return { previous };
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useDeleteGoal(cycleId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsQueryKey(cycleId) }),
  });
}
