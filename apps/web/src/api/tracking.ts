import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import { showToast } from "../lib/toast";
import type { LogStatus } from "../domain";
import type { Habit } from "./habits";

export type Cycle = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  /** Único ciclo con `isActive: true` — calculado en el backend
   * (apps/api/src/services/tracking.ts::getActiveCycle), única fuente de
   * verdad para no duplicar el criterio "cuál es el activo" en el cliente. */
  isActive: boolean;
};

export type HabitLog = {
  id: string;
  habitId: string;
  cycleId: string;
  date: string;
  status: LogStatus;
};

export type CycleLogs = {
  cycle: Cycle;
  days: string[];
  habits: Habit[];
  logs: HabitLog[];
};

export function useCycles() {
  return useQuery({
    queryKey: ["cycles"],
    queryFn: () => apiFetch<Cycle[]>("/cycles"),
  });
}

function cycleLogsQueryKey(cycleId: string | undefined) {
  return ["cycleLogs", cycleId] as const;
}

export function useCycleLogs(cycleId: string | undefined) {
  return useQuery({
    queryKey: cycleLogsQueryKey(cycleId),
    queryFn: () => apiFetch<CycleLogs>(`/cycles/${cycleId}/logs`),
    enabled: !!cycleId,
  });
}

type CreateCycleInput = { name: string; startDate: string; endDate: string };

export function useCreateCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCycleInput) =>
      apiFetch<Cycle>("/cycles", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cycles"] }),
  });
}

type SetLogStatusInput = { habitId: string; date: string; status: LogStatus };

/**
 * PUT /api/logs/:habitId/:date con actualización optimista sobre la query
 * cacheada de useCycleLogs(cycleId): la celda cambia de estado en el cache
 * (y por lo tanto en pantalla) en el mismo evento de clic, antes de que
 * responda el servidor. Si la mutación falla, se restaura el snapshot previo
 * (onError) y se muestra un toast — nunca un alert() ni un error silencioso.
 */
export function useSetLogStatus(cycleId: string) {
  const queryClient = useQueryClient();
  const queryKey = cycleLogsQueryKey(cycleId);

  return useMutation({
    mutationFn: ({ habitId, date, status }: SetLogStatusInput) =>
      apiFetch<HabitLog>(`/logs/${habitId}/${date}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),

    onMutate: async ({ habitId, date, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CycleLogs>(queryKey);

      queryClient.setQueryData<CycleLogs>(queryKey, (old) => {
        if (!old) return old;
        const existingIndex = old.logs.findIndex(
          (log) => log.habitId === habitId && log.date.slice(0, 10) === date,
        );
        const nextLogs = [...old.logs];
        if (existingIndex >= 0) {
          nextLogs[existingIndex] = { ...nextLogs[existingIndex], status };
        } else {
          nextLogs.push({
            id: `optimistic-${habitId}-${date}`,
            habitId,
            cycleId,
            date,
            status,
          });
        }
        return { ...old, logs: nextLogs };
      });

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      showToast("No se pudo guardar el cambio. Se revirtió la celda.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
