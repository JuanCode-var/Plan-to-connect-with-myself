import type { LibraryEntry } from "../../api/library";

/** Busca en título, autor y texto (resumen/idea/content) — pedido explícito del buscador de la portada. */
export function matchesLibrarySearch(entry: LibraryEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [entry.title, entry.author, entry.content, entry.resumen, entry.idea].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(q);
}
