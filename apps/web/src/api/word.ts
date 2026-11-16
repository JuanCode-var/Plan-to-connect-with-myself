import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HabitCategory } from "../domain";
import { apiFetch } from "./client";
import { todayISO } from "../lib/date";

export type WordCommitment = {
  id: string;
  title: string;
  text: string;
  startDate: string;
  targetDate: string;
  area: HabitCategory | null;
  // Para el recordatorio de cierre (Paso 5, ver lib/notifications.ts) — el
  // próximo tramo de mes que está "pendiente de cierre" ahora mismo, sin
  // exponer si quedó sellado o no. `null` si no hay ninguno pendiente.
  pendingClosure: { monthIndex: number; endDate: string } | null;
};

/** Ver computeMonthStatus en apps/api/src/lib/wordMonths.ts — la misma fuente de verdad, nunca recalculado en el cliente. */
export type WordCommitmentMonthStatus = "futuro" | "en_curso" | "pendiente_cierre" | "sellado" | "sin_sello";

export type WordCommitmentMonth = {
  monthIndex: number;
  startDate: string;
  endDate: string;
  isPartial: boolean;
  status: WordCommitmentMonthStatus;
  fallReportedAt: string | null;
};

export type WordCommitmentFinalState = "pendiente" | "sellado" | "sin_sello" | null;

/** Solo en la respuesta de /word/unlock — los tramos de mes ya resueltos contra hoy (ver buildMonthsInfo en la API). */
export type WordCommitmentUnlocked = WordCommitment & {
  durationLabel: string;
  totalMonths: number;
  currentMonthIndex: number;
  sealedCount: number;
  finalState: WordCommitmentFinalState;
  dayOfMonth: number;
  totalDaysInMonth: number;
  months: WordCommitmentMonth[];
};

export type WordMeta = {
  hasPin: boolean;
  isSigned: boolean;
  signedAt: string | null;
  commitmentCount: number;
};

export type WordVaultContent = {
  commitments: WordCommitmentUnlocked[];
  signatureDataUrl: string | null;
  signedAt: string | null;
  monthsWeight: number;
};

const metaKey = ["word", "meta"] as const;
const commitmentsKey = ["word", "commitments"] as const;
const weightKey = ["word", "weight"] as const;

export function useWordMeta() {
  return useQuery({ queryKey: metaKey, queryFn: () => apiFetch<WordMeta>("/word/meta") });
}

/**
 * A diferencia del resto de "Mi Palabra", esta NO pide PIN (ver GET
 * /word/commitments en la API) — es lo que alimenta el bloque de
 * compromisos en el Resumen, pensado para verse de pasada todos los días.
 */
export function useWordCommitments() {
  return useQuery({ queryKey: commitmentsKey, queryFn: () => apiFetch<WordCommitment[]>("/word/commitments") });
}

/** "Peso de tu palabra" (meses sellados en TODOS los compromisos) SIN pin — para mostrarlo fuera de /palabra (Paso 6: Mi núcleo de identidad). */
export function useWordWeight() {
  return useQuery({ queryKey: weightKey, queryFn: () => apiFetch<{ monthsWeight: number }>("/word/weight") });
}

/** Primera vez (todavía sin PIN) u cambio de uno ya configurado (requiere currentPin). */
export function useSetWordPin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { newPin: string; currentPin?: string }) =>
      apiFetch<void>("/word/pin", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: metaKey }),
  });
}

/**
 * El "entrar" a la sección: no hay query cacheada para el contenido en sí
 * (compromisos/firma) a propósito — cada visita vuelve a pedir el PIN y
 * vuelve a traer todo fresco desde /word/unlock, nunca queda en memoria
 * entre navegaciones. Ver mismo criterio en el backend (routes/word.ts).
 */
export function useUnlockWord() {
  return useMutation({
    mutationFn: (pin: string) =>
      apiFetch<WordVaultContent>("/word/unlock", { method: "POST", body: JSON.stringify({ pin, today: todayISO() }) }),
  });
}

export type WordCommitmentInput = {
  // Si viene, actualiza ESE compromiso existente; si no, se crea uno nuevo.
  // Ver PUT /word/commitments.
  id?: string;
  title: string;
  text: string;
  startDate: string;
  targetDate: string;
  area?: HabitCategory | null;
};

export function useSaveWordCommitments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { pin: string; items: WordCommitmentInput[] }) =>
      apiFetch<WordCommitment[]>("/word/commitments", { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: metaKey });
      // El Resumen muestra estos mismos compromisos sin PIN (ver
      // useWordCommitments arriba): si se editan desde /palabra, esa vista
      // tiene que refrescarse también, no solo la de adentro de la sección.
      queryClient.invalidateQueries({ queryKey: commitmentsKey });
      queryClient.invalidateQueries({ queryKey: weightKey });
    },
  });
}

/**
 * Cambiar el área de UN compromiso desde la tarjeta de "Circuitos en
 * recableado" (sin pin, ver PATCH en apps/api/src/routes/word.ts — es solo
 * una etiqueta de clasificación, no el contenido del compromiso).
 */
export function useSetCommitmentArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; area: HabitCategory | null }) =>
      apiFetch<{ id: string; area: HabitCategory | null }>(`/word/commitments/${input.id}/area`, {
        method: "PATCH",
        body: JSON.stringify({ area: input.area }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commitmentsKey }),
  });
}

/** "Sí, la honré" / "No del todo" al cerrar un mes — ver computeMonthStatus en la API, solo aplica a un tramo realmente "pendiente de cierre" ahora. */
export function useSealMonth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { commitmentId: string; monthIndex: number; pin: string; sealed: boolean }) =>
      apiFetch<{ commitment: WordCommitmentUnlocked; monthsWeight: number }>(
        `/word/commitments/${input.commitmentId}/months/${input.monthIndex}/seal`,
        { method: "POST", body: JSON.stringify({ pin: input.pin, sealed: input.sealed, today: todayISO() }) },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weightKey }),
  });
}

/** "Reportar una caída" — siempre sobre el mes EN CURSO del compromiso, nunca uno futuro ni uno ya terminado. */
export function useReportFall() {
  return useMutation({
    mutationFn: (input: { commitmentId: string; pin: string }) =>
      apiFetch<WordCommitmentUnlocked>(`/word/commitments/${input.commitmentId}/fall`, {
        method: "POST",
        body: JSON.stringify({ pin: input.pin, today: todayISO() }),
      }),
  });
}

export function useSaveWordSignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { pin: string; signatureDataUrl: string }) =>
      apiFetch<{ signatureDataUrl: string; signedAt: string }>("/word/signature", {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: metaKey }),
  });
}
