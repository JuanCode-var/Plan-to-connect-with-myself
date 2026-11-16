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
  // "Mi Brújula" (etapa 2): a qué versión de uno mismo le sirve este hábito.
  identityId: string | null;
  minimalVersion: string | null;
  // "Hábitos por identidad" (mockups 16e-16i): completa "Me convierte en
  // alguien que…". `null` = todavía sin escribir (estado vacío, nunca
  // inventado).
  meConvierteEn: string | null;
  identityMessagesEnabled: boolean;
  // Días de la semana en que aplica (0=domingo..6=sábado). `null` = todos
  // los días — ver WeekdaySelector.tsx y el comentario en schema.prisma.
  activeWeekdays: number[] | null;
};

export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: () => apiFetch<Habit[]>("/habits"),
  });
}

// Etapa de mielinización POR HÁBITO (Catálogo de hábitos, mockups 16/16b) —
// ver catalogStageFor en apps/api/src/services/tracking.ts para la fórmula
// exacta (ventana de 30 días, umbral de 66 días acumulados para Automático).
export type CatalogStage = "nuevo" | "poda" | "chispa" | "sendero" | "consolidado" | "automatico";
// `last30`: un booleano por día de la ventana (oldest→newest, 30 entradas,
// true = DONE ese día) — para la rejilla "ÚLTIMOS 30 DÍAS" del panel de
// detalle (Paso 5 del rediseño de identidad). `lifetimeDone`: total de
// DONE de toda la vida, para "Llevas X de 66 días para volverlo automático."
export type CatalogHabit = Habit & { percent: number; stage: CatalogStage; lifetimeDone: number; last30: boolean[] };

/** Trae TODOS los hábitos (activos y pausados, a diferencia de useHabits) con su % y etapa reales. */
export function useHabitsCatalog() {
  return useQuery({
    queryKey: ["habits", "catalog"],
    queryFn: () => apiFetch<CatalogHabit[]>("/habits/catalog"),
  });
}

export type HabitIdentityStat = {
  habitId: string;
  name: string;
  category: HabitCategory;
  priority: HabitPriorityLevel;
  lifetimeImpulses: number;
  currentStreak: number;
};

export type HabitIdentityStats = {
  weeklyActions: { total: number; byCategory: Partial<Record<HabitCategory, number>> };
  habits: HabitIdentityStat[];
};

/** "Mi Identidad": acciones de la semana + impulsos de toda la vida/racha por hábito (ver GET /habits/identity-stats). */
export function useHabitIdentityStats() {
  return useQuery({
    queryKey: ["habits", "identity-stats"],
    queryFn: () => apiFetch<HabitIdentityStats>("/habits/identity-stats"),
  });
}

type CreateHabitInput = {
  name: string;
  moment: HabitMoment;
  specification: string;
  category: HabitCategory;
  priority: HabitPriorityLevel;
  identityId?: string | null;
  minimalVersion?: string | null;
  meConvierteEn?: string | null;
  activeWeekdays?: number[] | null;
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
  data: Partial<
    Pick<
      Habit,
      | "name"
      | "moment"
      | "specification"
      | "category"
      | "priority"
      | "active"
      | "identityId"
      | "minimalVersion"
      | "meConvierteEn"
      | "identityMessagesEnabled"
      | "activeWeekdays"
    >
  >;
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

/** Igual que useReorderHabits, pero sobre la caché de ["habits","catalog"] (CatalogHabit, no Habit) — para el Catálogo de hábitos nuevo (mockups 16/16b). */
export function useReorderCatalogHabits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch<void>("/habits/reorder", { method: "PUT", body: JSON.stringify({ ids }) }),

    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ["habits", "catalog"] });
      const previous = queryClient.getQueryData<CatalogHabit[]>(["habits", "catalog"]);

      if (previous) {
        const subset = ids
          .map((id) => previous.find((h) => h.id === id))
          .filter((h): h is CatalogHabit => h !== undefined);
        const sortedValues = subset.map((h) => h.sortOrder).sort((a, b) => a - b);
        const newSortOrderById = new Map(ids.map((id, i) => [id, sortedValues[i]]));

        queryClient.setQueryData<CatalogHabit[]>(
          ["habits", "catalog"],
          previous.map((h) => (newSortOrderById.has(h.id) ? { ...h, sortOrder: newSortOrderById.get(h.id)! } : h)),
        );
      }

      return { previous };
    },

    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["habits", "catalog"], context.previous);
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
