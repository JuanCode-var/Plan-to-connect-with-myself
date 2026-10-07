import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { Emotion } from "../domain";

export type JournalEntry = {
  id: string;
  date: string;
  emotion: Emotion | null;
  situation: string | null;
  feeling: string | null;
  impulse: string | null;
  decision: string | null;
  learning: string | null;
  knowledge: string | null;
  gratitude: string | null;
  createdAt: string;
};

type JournalFilters = { from?: string; to?: string; emotion?: Emotion; kind?: "emotion" | "knowledge" | "gratitude" };

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
  situation?: string;
  feeling?: string;
  impulse?: string;
  decision?: string;
  learning?: string;
  knowledge?: string;
  gratitude?: string;
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
