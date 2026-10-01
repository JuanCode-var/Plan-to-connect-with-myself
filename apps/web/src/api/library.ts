import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import { showToast } from "../lib/toast";
import type { LibrarySection } from "../domain";

export type LibraryEntry = {
  id: string;
  section: LibrarySection;
  source: "SEED" | "USER";
  title: string | null;
  author: string | null;
  content: string;
  createdAt: string;
};

export function useLibrary(section?: LibrarySection) {
  return useQuery({
    queryKey: ["library", section ?? "ALL"],
    queryFn: () => apiFetch<LibraryEntry[]>(section ? `/library?section=${section}` : "/library"),
    // Contenido curado + del usuario, cambia poco: no vale la pena
    // refetchear agresivo, y así el sorteo de frase (ver randomQuote) usa
    // datos ya en cache la mayoría de las veces.
    staleTime: 5 * 60 * 1000,
  });
}

type CreateLibraryEntryInput = {
  section: LibrarySection;
  title?: string;
  author?: string;
  content: string;
};

export function useCreateLibraryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLibraryEntryInput) =>
      apiFetch<LibraryEntry>("/library", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
    onError: () => showToast("No se pudo guardar la entrada."),
  });
}

export function useDeleteLibraryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/library/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
    onError: () => showToast("No se pudo eliminar la entrada."),
  });
}

export function randomLibraryEntry(entries: LibraryEntry[] | undefined): LibraryEntry | undefined {
  if (!entries || entries.length === 0) return undefined;
  return entries[Math.floor(Math.random() * entries.length)];
}
