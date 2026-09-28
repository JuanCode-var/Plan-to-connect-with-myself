import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { HabitCategory, HabitMoment } from "../domain";

export type Habit = {
  id: string;
  name: string;
  moment: HabitMoment;
  specification: string;
  category: HabitCategory;
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
  data: Partial<Pick<Habit, "name" | "moment" | "specification" | "category" | "active">>;
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
