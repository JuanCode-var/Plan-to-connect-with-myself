import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import { showToast } from "../lib/toast";
import type { HabitCategory, LibrarySection, PinDuration } from "../domain";

export type LibraryIdea = { title: string; text: string; action: string; habitName: string };

export type LibraryEntry = {
  id: string;
  section: LibrarySection;
  source: "SEED" | "USER";
  title: string | null;
  author: string | null;
  content: string;
  createdAt: string;
  pinnedUntil: string | null;
  // "Alimento para tu cerebro" (Fase 0): `area` arranca en null en todo el
  // contenido existente — asignarla es juicio editorial, no se adivina.
  // `resumen`/`idea`/`ideasJson` solo los usa LIBRO; `ideasJson` llega como
  // string y se parsea acá (ver parseLibraryIdeas) porque el server lo
  // guarda serializado (ver comentario en schema.prisma: son objetos
  // anidados, no una lista plana, así que no es el mismo CSV que
  // Habit.activeWeekdays).
  area: HabitCategory | null;
  resumen: string | null;
  idea: string | null;
  ideasJson: string | null;
  schoolId: string | null;
};

export function parseLibraryIdeas(entry: Pick<LibraryEntry, "ideasJson">): LibraryIdea[] {
  if (!entry.ideasJson) return [];
  try {
    const parsed = JSON.parse(entry.ideasJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export type LibrarySchool = {
  id: string;
  name: string;
  area: HabitCategory | null;
  entryCount: number;
  challengeDays: Array<{ id: string; day: number; text: string }>;
  /** 0 = sin empezar, 1-7 = último día completado (7 = reto terminado). */
  currentDay: number;
};

export type BookReadingProgress = {
  id: string;
  entryId: string;
  tab: "IDEA" | "IDEAS" | "RESUMEN";
  currentIdeaIndex: number;
  percent: number;
  status: "NUEVO" | "EN_PROGRESO" | "LEIDO";
};

export type UnlockedQuote = { id: string; entryId: string; unlockedAt: string };

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

/**
 * Frase anclada vigente para /tracker (o null si no hay ninguna). Mismo
 * prefijo de queryKey que useLibrary(["library", ...]) a propósito: así
 * invalidar ["library"] (crear/borrar/anclar una entrada) refresca esto
 * también, sin tener que listar cada queryKey a mano en cada mutación.
 */
export function usePinnedQuote() {
  return useQuery({
    queryKey: ["library", "pinned"],
    queryFn: () => apiFetch<LibraryEntry | null>("/library/pinned"),
    staleTime: 60 * 1000,
  });
}

export function usePinLibraryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, duration }: { id: string; duration: PinDuration }) =>
      apiFetch<LibraryEntry>(`/library/${id}/pin`, { method: "POST", body: JSON.stringify({ duration }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
    onError: () => showToast("No se pudo anclar la frase."),
  });
}

export function useUnpinLibraryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<LibraryEntry>(`/library/${id}/unpin`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
    onError: () => showToast("No se pudo desanclar la frase."),
  });
}

export function useLibrarySchools() {
  return useQuery({
    queryKey: ["library", "schools"],
    queryFn: () => apiFetch<LibrarySchool[]>("/library/schools"),
    staleTime: 60 * 1000,
  });
}

export function useBookReadingProgress() {
  return useQuery({
    queryKey: ["library", "reading-progress"],
    queryFn: () => apiFetch<BookReadingProgress[]>("/library/reading-progress"),
  });
}

export type UpdateReadingProgressInput = {
  tab?: BookReadingProgress["tab"];
  currentIdeaIndex?: number;
  percent?: number;
  status?: BookReadingProgress["status"];
};

export function useUpdateReadingProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: UpdateReadingProgressInput }) =>
      apiFetch<BookReadingProgress>(`/library/${entryId}/reading-progress`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library", "reading-progress"] }),
    onError: () => showToast("No se pudo guardar tu avance de lectura."),
  });
}

export function useAdvanceSchoolDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (schoolId: string) => apiFetch(`/library/schools/${schoolId}/advance-day`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library", "schools"] }),
    onError: () => showToast("No se pudo guardar el avance del reto."),
  });
}

export function useUnlockedQuotes() {
  return useQuery({
    queryKey: ["library", "unlocked-quotes"],
    queryFn: () => apiFetch<UnlockedQuote[]>("/library/unlocked-quotes"),
  });
}

export function randomLibraryEntry(entries: LibraryEntry[] | undefined): LibraryEntry | undefined {
  if (!entries || entries.length === 0) return undefined;
  return entries[Math.floor(Math.random() * entries.length)];
}
