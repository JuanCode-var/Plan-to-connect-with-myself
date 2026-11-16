import { Link } from "react-router-dom";
import type { LibraryEntry } from "../../api/library";
import { BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREA_RGB, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { BookCoverMini } from "./BookCoverMini";
import { estimateReadingMinutes } from "./readingTime";

/** "PARA TI HOY" (Fase 1, punto 3b) — el libro del área con menor % del ciclo (selectBookForYou, forYouSelectors.ts). */
export function BookForYouCard({ book, area }: { book: LibraryEntry; area: BrainArea }) {
  const color = BRAIN_AREA_COLOR[area];
  const rgb = BRAIN_AREA_RGB[area];
  const minutes = estimateReadingMinutes(book.resumen ?? book.content);

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-5"
      style={{ background: `linear-gradient(170deg, rgba(${rgb},0.12), rgba(255,255,255,0.03))`, border: `1px solid rgba(${rgb},0.3)` }}
    >
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>PARA TI HOY</span>
      <div className="flex gap-4">
        <BookCoverMini area={area} title={book.title} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.25 }}>
            {book.title ?? "Sin título"}
          </span>
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>
            {book.author ?? "Autor por confirmar"} · {minutes} min
          </span>
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, lineHeight: 1.4, color: "#E6E9F5" }}>
            Tu área {BRAIN_AREA_LABEL[area]} es la que más espacio tiene para crecer.
          </span>
        </div>
      </div>
      <Link
        to={`/library/leer/${book.id}`}
        className="flex items-center justify-center rounded-xl no-underline"
        style={{ height: 44, background: color, color: "#070B1F", fontFamily: NEURAL_FONT_BODY, fontSize: 14, fontWeight: 700 }}
      >
        Empezar a leer
      </Link>
    </div>
  );
}
