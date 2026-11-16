import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";

export type Identity = { id: string; statement: string; why: string | null };
export type Weakness = { id: string; text: string; counterMessage: string | null };

export type Compass = {
  id: string;
  // Autoconocimiento
  uniqueness: string | null;
  enjoyWithoutBeingAsked: string | null;
  strengths: string | null;
  weaknesses: Weakness[];
  // Valores y Creencias
  coreValues: string | null;
  limitingBeliefs: string | null;
  beliefsToReprogram: string | null;
  empoweringBeliefs: string | null;
  // Propósito y Dirección
  cause: string | null;
  impact: string | null;
  howToLiveDays: string | null;

  identityOnboardingCompletedAt: string | null;
  lastReviewedAt: string | null;
  messagesEnabled: boolean;
  identities: Identity[];

  // "Hábitos por identidad" (mockups 16e-16i): frase por área, null mientras
  // no se edite (el frontend cae a DEFAULT_AREA_IDENTITY en ese caso).
  identityMental: string | null;
  identityEconomica: string | null;
  identityHabilidades: string | null;
  identityEmocional: string | null;
  identityFisica: string | null;
  identityEspiritual: string | null;
};

const compassKey = ["compass"] as const;

// `data` es `Compass | null` (todavía no completó nada) a propósito: ese
// null (o `identityOnboardingCompletedAt` en null) es la señal que lee
// RequireAuth.tsx para forzar el cuestionario obligatorio post-registro.
export function useCompass() {
  return useQuery({ queryKey: compassKey, queryFn: () => apiFetch<Compass | null>("/compass") });
}

export type CompassProfileInput = Partial<
  Pick<
    Compass,
    | "uniqueness"
    | "enjoyWithoutBeingAsked"
    | "strengths"
    | "coreValues"
    | "limitingBeliefs"
    | "beliefsToReprogram"
    | "empoweringBeliefs"
    | "cause"
    | "impact"
    | "howToLiveDays"
    | "identityMental"
    | "identityEconomica"
    | "identityHabilidades"
    | "identityEmocional"
    | "identityFisica"
    | "identityEspiritual"
  >
>;

export function useSaveCompassProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompassProfileInput) =>
      apiFetch<Compass>("/compass", { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: (compass) => queryClient.setQueryData(compassKey, compass),
  });
}

export function useMarkCompassReviewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ lastReviewedAt: string }>("/compass/review", { method: "PUT" }),
    onSuccess: ({ lastReviewedAt }) =>
      queryClient.setQueryData<Compass | null>(compassKey, (old) => (old ? { ...old, lastReviewedAt } : old)),
  });
}

export type IdentityInput = { statement: string; why: string };

export function useSaveIdentities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: IdentityInput[]) =>
      apiFetch<Identity[]>("/compass/identities", { method: "PUT", body: JSON.stringify({ items }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: compassKey }),
  });
}

export type WeaknessInput = { text: string; counterMessage: string };

export function useSaveWeaknesses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: WeaknessInput[]) =>
      apiFetch<Weakness[]>("/compass/weaknesses", { method: "PUT", body: JSON.stringify({ items }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: compassKey }),
  });
}

// Interruptor general de las intervenciones de identidad (etapa 3, distinto
// del por-hábito en api/habits.ts).
export function useSetCompassMessagesEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messagesEnabled: boolean) =>
      apiFetch<{ messagesEnabled: boolean }>("/compass/messages-enabled", {
        method: "PUT",
        body: JSON.stringify({ messagesEnabled }),
      }),
    onSuccess: ({ messagesEnabled }) =>
      queryClient.setQueryData<Compass | null>(compassKey, (old) => (old ? { ...old, messagesEnabled } : old)),
  });
}

// Marca terminado el cuestionario obligatorio post-registro — ver
// RequireAuth.tsx, que deja de forzar el wizard apenas esto queda seteado.
export function useCompleteIdentityOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ identityOnboardingCompletedAt: string }>("/compass/complete-onboarding", { method: "PUT" }),
    onSuccess: ({ identityOnboardingCompletedAt }) =>
      queryClient.setQueryData<Compass | null>(compassKey, (old) =>
        old ? { ...old, identityOnboardingCompletedAt } : old,
      ),
  });
}

export type CompassReflectionEntry = { id: string; answer: string; date: string; context: string | null };

export function useCompassReflections() {
  return useQuery({
    queryKey: ["compass", "reflections"],
    queryFn: () => apiFetch<CompassReflectionEntry[]>("/compass/reflections"),
  });
}

// Guarda una respuesta al diario — hoy solo la usa el trigger de "¿qué se
// interpuso?" (etapa 3, vía `context`).
export function useSaveCompassReflection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { answer: string; date: string; context?: string }) =>
      apiFetch<void>("/compass/reflections", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["compass", "reflections"] }),
  });
}

// ─── "Mi núcleo de identidad" (3 pilares) ───────────────────────────────

export type PillarKey = "autoconocimiento" | "valores" | "proposito";

export type PurposeAction = { id: string; text: string; completed: boolean };

export type PillarsState = {
  sealed: Record<PillarKey, string | null>;
  lastFullPillarsJourneyAt: string | null;
  nextReviewSuggestedAt: string | null;
  today: {
    strengthsUsed: string[];
    valuesLived: string[];
    beliefsReprogrammed: boolean;
    purposeAction: PurposeAction | null;
  };
};

const pillarsKey = ["compass", "pillars"] as const;

export function usePillarsState() {
  return useQuery({ queryKey: pillarsKey, queryFn: () => apiFetch<PillarsState>("/compass/pillars") });
}

export type PillarsProgressInput = Partial<{ strengthsUsed: string[]; valuesLived: string[]; beliefsReprogrammed: boolean }>;

export function useSavePillarsProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PillarsProgressInput) =>
      apiFetch<PillarsState["today"]>("/compass/pillars/progress", { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: (today) =>
      queryClient.setQueryData<PillarsState | undefined>(pillarsKey, (old) => (old ? { ...old, today: { ...old.today, ...today } } : old)),
  });
}

export function useSealPillar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pillar: PillarKey) =>
      apiFetch<{ allSealed: boolean; nextReviewSuggestedAt?: string }>("/compass/pillars/seal", {
        method: "POST",
        body: JSON.stringify({ pillar }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pillarsKey });
      queryClient.invalidateQueries({ queryKey: compassKey });
    },
  });
}

export function useCreatePurposeAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      apiFetch<PurposeAction>("/compass/pillars/purpose-action", { method: "POST", body: JSON.stringify({ text }) }),
    onSuccess: (purposeAction) =>
      queryClient.setQueryData<PillarsState | undefined>(pillarsKey, (old) => (old ? { ...old, today: { ...old.today, purposeAction } } : old)),
  });
}
