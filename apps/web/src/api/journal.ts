import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { Emotion } from "../domain";

export type JournalEntry = {
  id: string;
  date: string;
  emotion: Emotion | null;
  intensity: number | null;
  situation: string | null;
  feeling: string | null;
  impulse: string | null;
  decision: string | null;
  learning: string | null;
  knowledge: string | null;
  source: string | null;
  learningId: string | null;
  gratitude: string | null;
  flowMinutes: number | null;
  flowActivity: string | null;
  createdAt: string;
};

type JournalFilters = {
  from?: string;
  to?: string;
  emotion?: Emotion;
  kind?: "emotion" | "knowledge" | "gratitude" | "flow";
};

function buildQuery(filters: JournalFilters): string {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.emotion) params.set("emotion", filters.emotion);
  if (filters.kind) params.set("kind", filters.kind);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useJournalEntries(filters: JournalFilters = {}) {
  return useQuery({
    queryKey: ["journal", filters],
    queryFn: () => apiFetch<JournalEntry[]>(`/journal${buildQuery(filters)}`),
  });
}

type CreateJournalEntryInput = {
  date: string;
  emotion?: Emotion;
  intensity?: number;
  situation?: string;
  feeling?: string;
  impulse?: string;
  decision?: string;
  learning?: string;
  knowledge?: string;
  source?: string;
  learningId?: string;
  gratitude?: string;
  flowMinutes?: number;
  flowActivity?: string;
};

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateJournalEntryInput) =>
      apiFetch<JournalEntry>("/journal", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal"] }),
  });
}

export type GratitudeHabitMarked = { habitId: string; name: string; streak: number };

/**
 * POST /journal/gratitude — guarda hasta 3 líneas en una sola llamada (cada
 * una como su propia fila) y, si existe un hábito de gratitud propio, lo
 * marca cumplido hoy y devuelve su racha (ver comentario en
 * apps/api/src/routes/journal.ts). Ruta propia en vez de 3 llamadas a
 * useCreateJournalEntry porque ese efecto secundario debe pasar UNA sola
 * vez por guardado, no una vez por línea.
 */
export function useCreateGratitudeEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; items: string[] }) =>
      apiFetch<{ entries: JournalEntry[]; habitMarked: GratitudeHabitMarked | null }>("/journal/gratitude", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal"] });
      queryClient.invalidateQueries({ queryKey: ["cycleLogs"] });
    },
  });
}
