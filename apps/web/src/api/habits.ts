import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import { showToast } from "../lib/toast";
import type { HabitCategory, HabitMoment, HabitPriorityLevel } from "../domain";

export type Habit = {
  id: string;
  name: string;
  moment: HabitMoment;
  specification: string;
  category: HabitCategory;
  priority: HabitPriorityLevel;
  sortOrder: number;
  active: boolean;
  createdAt: string;
};

export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: () => apiFetch<Habit[]>("/habits"),
  });
}

type CreateHabitInput = {
  name: string;
  moment: HabitMoment;
  specification: string;
  category: HabitCategory;
  priority: HabitPriorityLevel;
};

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHabitInput) =>
      apiFetch<Habit>("/habits", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });
}

type UpdateHabitInput = {
  id: string;
  data: Partial<Pick<Habit, "name" | "moment" | "specification" | "category" | "priority" | "active">>;
};

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateHabitInput) =>
      apiFetch<Habit>(`/habits/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });
}

/**
 * PUT /api/habits/reorder con actualización optimista (mismo patrón que
 * useSetLogStatus en api/tracking.ts): `ids` es el nuevo orden deseado
 * dentro de un mismo momento del día. Se reasignan localmente los mismos
 * valores de sortOrder que esos hábitos ya tenían (ver comentario del
 * backend) para que el cambio se vea al instante, antes de que responda el
 * servidor; si falla, se revierte y se avisa con un toast.
 */
export function useReorderHabits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch<void>("/habits/reorder", { method: "PUT", body: JSON.stringify({ ids }) }),

    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      const previous = queryClient.getQueryData<Habit[]>(["habits"]);

      if (previous) {
        const subset = ids
          .map((id) => previous.find((h) => h.id === id))
          .filter((h): h is Habit => h !== undefined);
        const sortedValues = subset.map((h) => h.sortOrder).sort((a, b) => a - b);
        const newSortOrderById = new Map(ids.map((id, i) => [id, sortedValues[i]]));

        queryClient.setQueryData<Habit[]>(
          ["habits"],
          previous.map((h) => (newSortOrderById.has(h.id) ? { ...h, sortOrder: newSortOrderById.get(h.id)! } : h)),
        );
      }

      return { previous };
    },

    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["habits"], context.previous);
      }
      showToast("No se pudo guardar el nuevo orden.");
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });
}

/**
 * Igual que useDeleteCycle (api/tracking.ts): borra el hábito y, con él,
 * todos sus HabitLog (ver DELETE /habits/:id). Invalida tanto el catálogo
 * como las matrices de ciclo ya cacheadas, que también traen los hábitos.
 */
export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/habits/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["cycleLogs"] });
    },
    onError: () => {
      showToast("No se pudo eliminar el hábito.");
    },
  });
}
