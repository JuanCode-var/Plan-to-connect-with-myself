import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { ApplicationType, HabitCategory, MicroActionOrigin } from "../domain";

// "Micro acciones": un solo archivo para los 4 recursos del dominio
// (Learning, MicroAction, LearningApplication, WoopPlan) — mismo criterio
// que api/compass.ts, que agrupa Compass + Identity + Weakness + Reflection.

/** Ver connectionLevelFor en apps/api/src/lib/connectionLevel.ts — misma fuente de verdad, nunca recalculado en el cliente. */
export type ConnectionLevelKey = "por_encender" | "chispa" | "sendero" | "consolidada";
export type ConnectionLevel = { key: ConnectionLevelKey; label: string; color: string; glow: boolean };

export type Learning = {
  id: string;
  title: string;
  keyIdea: string | null;
  source: string | null;
  area: HabitCategory;
  archived: boolean;
  createdAt: string;
  // Vínculo opcional a un hábito elegido a mano — ver GET /learnings/suggested/:habitId.
  habitId: string | null;
};

/** Solo en GET /learnings (lista) — ver Paso 2 del pedido. */
export type LearningWithStats = Learning & {
  applicationsCount: number;
  level: ConnectionLevel;
  lastActivityAt: string;
};

/** Solo en GET /learnings/:id/detail — panel de detalle de Aprendizajes (Paso 4). */
export type LearningDetail = Learning & {
  applicationsCount: number;
  level: ConnectionLevel;
  derivedIdea: { text: string; label: string } | null;
  insight: string | null;
  microActionsCount: number;
  duplicateGroups: number;
  duplicateExtras: number;
  notesCount: number;
};

const learningsKey = ["learnings"] as const;

export function useLearnings() {
  return useQuery({ queryKey: learningsKey, queryFn: () => apiFetch<LearningWithStats[]>("/learnings") });
}

export function useLearningDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["learnings", "detail", id],
    queryFn: () => apiFetch<LearningDetail>(`/learnings/${id}/detail`),
    enabled: !!id,
  });
}

export function useSuggestedLearning(habitId: string | undefined) {
  return useQuery({
    queryKey: ["learnings", "suggested", habitId],
    queryFn: () => apiFetch<Learning | null>(`/learnings/suggested/${habitId}`),
    enabled: !!habitId,
  });
}

export type CreateLearningInput = {
  title: string;
  keyIdea?: string | null;
  source?: string | null;
  area: HabitCategory;
  habitId?: string | null;
};

export function useCreateLearning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLearningInput) =>
      apiFetch<Learning>("/learnings", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningsKey }),
  });
}

export function useUpdateLearning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLearningInput & { archived: boolean }> }) =>
      apiFetch<Learning>(`/learnings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: learningsKey }),
  });
}

export function useDeleteLearning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/learnings/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningsKey });
      queryClient.invalidateQueries({ queryKey: ["microActions"] });
    },
  });
}

/** "Ordenar" (Paso 4) — unifica micro acciones repetidas y convierte las notas en Applications. */
export function useOrderLearning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (learningId: string) =>
      apiFetch<{ mergedDuplicates: number; convertedNotes: number }>(`/learnings/${learningId}/order`, { method: "POST" }),
    onSuccess: (_result, learningId) => {
      queryClient.invalidateQueries({ queryKey: learningsKey });
      queryClient.invalidateQueries({ queryKey: ["learnings", "detail", learningId] });
      queryClient.invalidateQueries({ queryKey: ["microActions"] });
      queryClient.invalidateQueries({ queryKey: ["learningApplications"] });
    },
  });
}

export type MicroAction = {
  id: string;
  learningId: string | null;
  text: string;
  date: string;
  completed: boolean;
  completedAt: string | null;
  origin: MicroActionOrigin;
  isLikelyNote: boolean;
  learning: { id: string; title: string; area: HabitCategory } | null;
};

export function useMicroActions(date?: string) {
  return useQuery({
    queryKey: ["microActions", "byDate", date ?? "today"],
    queryFn: () => apiFetch<MicroAction[]>(`/micro-actions${date ? `?date=${date}` : ""}`),
  });
}

export function useMicroActionsByLearning(learningId: string) {
  return useQuery({
    queryKey: ["microActions", "byLearning", learningId],
    queryFn: () => apiFetch<MicroAction[]>(`/micro-actions?learningId=${learningId}`),
  });
}

export type MicroActionsSummary = { today: { completed: number; total: number }; week: { completed: number; total: number } };

export function useMicroActionsSummary() {
  return useQuery({ queryKey: ["microActions", "summary"], queryFn: () => apiFetch<MicroActionsSummary>("/micro-actions/summary") });
}

function invalidateMicroActions(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["microActions"] });
}

export function useCreateMicroAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { learningId: string; text: string; date?: string; origin?: MicroActionOrigin }) =>
      apiFetch<MicroAction>("/micro-actions", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      invalidateMicroActions(queryClient);
      queryClient.invalidateQueries({ queryKey: learningsKey });
    },
  });
}

export function useToggleMicroAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      apiFetch<MicroAction>(`/micro-actions/${id}`, { method: "PATCH", body: JSON.stringify({ completed }) }),
    onSuccess: () => invalidateMicroActions(queryClient),
  });
}

export function useMoveMicroActionToTomorrow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      apiFetch<MicroAction>(`/micro-actions/${id}`, { method: "PATCH", body: JSON.stringify({ date }) }),
    onSuccess: () => invalidateMicroActions(queryClient),
  });
}

/** "¿Qué aprendiste al hacerlo?" (Paso 3) — marca hecha la micro acción Y guarda la reflexión en el mismo paso. */
export function useCompleteMicroActionWithReflection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text, context }: { id: string; text: string; context?: string }) =>
      apiFetch<{ microAction: MicroAction; application: LearningApplication; level: ConnectionLevel }>(
        `/micro-actions/${id}/complete-with-reflection`,
        { method: "POST", body: JSON.stringify({ text, context }) },
      ),
    onSuccess: () => {
      invalidateMicroActions(queryClient);
      queryClient.invalidateQueries({ queryKey: ["learningApplications"] });
      queryClient.invalidateQueries({ queryKey: learningsKey });
    },
  });
}

export type LearningApplication = {
  id: string;
  habitId: string | null;
  context: string | null;
  learningId: string;
  type: ApplicationType;
  response: string;
  date: string;
  habit: { id: string; name: string } | null;
  learning: { id: string; title: string; area: HabitCategory };
};

export type LearningApplicationsWeekSummary = { weekStart: string; total: number; byDay: Record<string, number> };

/** "Esta semana" (Paso 3) — aplicaciones por día de la semana calendario (lunes a domingo) que contiene hoy. */
export function useLearningApplicationsWeekSummary() {
  return useQuery({
    queryKey: ["learningApplications", "summary"],
    queryFn: () => apiFetch<LearningApplicationsWeekSummary>("/learning-applications/summary"),
  });
}

export function useLearningApplications(learningId?: string) {
  return useQuery({
    queryKey: ["learningApplications", learningId ?? "all"],
    queryFn: () => apiFetch<LearningApplication[]>(`/learning-applications${learningId ? `?learningId=${learningId}` : ""}`),
  });
}

export function useCreateLearningApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      habitId?: string;
      context?: string;
      learningId: string;
      type: ApplicationType;
      response: string;
    }) => apiFetch<LearningApplication>("/learning-applications", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learningApplications"] });
      queryClient.invalidateQueries({ queryKey: learningsKey });
    },
  });
}

export type WoopPlan = {
  id: string;
  title: string | null;
  desire: string;
  result: string;
  obstacle: string;
  planIf: string;
  planThen: string;
  // "Hábitos por identidad": a qué área de vida pertenece este plan — null
  // en planes viejos, nunca inventado (ver HabitIdentityGrid.tsx).
  area: HabitCategory | null;
  identityId: string | null;
  sourceInsightType: string | null;
  sourceInsightSummary: string | null;
  reminderWeekday: number | null;
  reminderTime: string | null;
  timesUsed: number;
  timesWorked: number;
  lastResultDate: string | null;
  active: boolean;
  createdAt: string;
};

export function useWoopPlans() {
  return useQuery({ queryKey: ["woopPlans"], queryFn: () => apiFetch<WoopPlan[]>("/woop-plans") });
}

export type CreateWoopPlanInput = {
  title?: string | null;
  desire: string;
  result: string;
  obstacle: string;
  planIf: string;
  planThen: string;
  area?: HabitCategory | null;
  identityId?: string | null;
  sourceInsightType?: string | null;
  sourceInsightSummary?: string | null;
  reminderWeekday?: number | null;
  reminderTime?: string | null;
};

export function useCreateWoopPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWoopPlanInput) =>
      apiFetch<WoopPlan>("/woop-plans", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["woopPlans"] }),
  });
}

export function useUpdateWoopPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWoopPlanInput & { active: boolean }> }) =>
      apiFetch<WoopPlan>(`/woop-plans/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["woopPlans"] }),
  });
}

export function useReportWoopResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, worked }: { id: string; worked: boolean }) =>
      apiFetch<WoopPlan>(`/woop-plans/${id}/result`, { method: "POST", body: JSON.stringify({ worked }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["woopPlans"] }),
  });
}
