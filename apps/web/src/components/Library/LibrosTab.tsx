import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBookReadingProgress, type BookReadingProgress, type LibraryEntry } from "../../api/library";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREAS, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { estimateReadingMinutes } from "./readingTime";

function BookGridCard({ book, progress }: { book: LibraryEntry; progress: BookReadingProgress | undefined }) {
  const area = book.area ? AREA_OF_CATEGORY[book.area] : null;
  const color = area ? BRAIN_AREA_COLOR[area] : "#64748B";
  const minutes = estimateReadingMinutes(book.resumen ?? book.content);
  const status = progress?.status ?? "NUEVO";
  const statusLabel = status === "LEIDO" ? "Leído" : status === "EN_PROGRESO" ? `${progress?.percent ?? 0} %` : `${minutes} min`;

  return (
    <Link
      to={`/library/leer/${book.id}`}
      className="flex flex-col overflow-hidden rounded-2xl no-underline"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex items-center px-3"
        style={{ height: 44, background: `linear-gradient(100deg, ${color}, rgba(255,255,255,0.08))` }}
      >
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "#070B1F", textTransform: "uppercase" }}>
          {area ? BRAIN_AREA_LABEL[area] : "Sin área"}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.25 }}>
          {book.title ?? "Sin título"}
        </span>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>{book.author ?? "Autor por confirmar"}</span>
        <div className="mt-1" style={{ height: 3, borderRadius: 1.5, background: "rgba(255,255,255,0.08)" }}>
          <div style={{ width: `${status === "LEIDO" ? 100 : (progress?.percent ?? 0)}%`, height: 3, borderRadius: 1.5, background: color }} />
        </div>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>{statusLabel}</span>
      </div>
    </Link>
  );
}

const FILTERS: Array<{ key: BrainArea | "TODAS"; label: string }> = [
  { key: "TODAS", label: "Todas" },
  ...BRAIN_AREAS.map((a) => ({ key: a, label: BRAIN_AREA_LABEL[a] })),
];

/** Pestaña "Libros" (Fase 1, punto 4) — grilla de 3 columnas + filtro por área. */
export function LibrosTab({ books }: { books: LibraryEntry[] }) {
  const { data: readingProgress } = useBookReadingProgress();
  const [filter, setFilter] = useState<BrainArea | "TODAS">("TODAS");

  const filtered = useMemo(() => {
    if (filter === "TODAS") return books;
    return books.filter((b) => (b.area ? AREA_OF_CATEGORY[b.area] : null) === filter);
  }, [books, filter]);

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Filtrar por área" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.key)}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 999,
                fontFamily: NEURAL_FONT_BODY,
                fontSize: 13,
                fontWeight: 600,
                color: on ? "#070B1F" : "#E6E9F5",
                background: on ? "#22D3EE" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && filter !== "TODAS" ? (
        <div
          className="flex flex-col items-center justify-center gap-1 rounded-2xl p-10 text-center"
          style={{ border: "1px dashed rgba(255,255,255,0.16)", minHeight: 180 }}
        >
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, color: NEURAL_TEXT_SECONDARY }}>Aún sin lecturas · Agregar</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => (
            <BookGridCard key={book.id} book={book} progress={readingProgress?.find((p) => p.entryId === book.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
