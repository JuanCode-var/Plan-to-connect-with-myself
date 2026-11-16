import { Link } from "react-router-dom";
import type { BookReadingProgress, LibraryEntry, LibrarySchool } from "../../api/library";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { BookCoverMini } from "./BookCoverMini";

function ReadingInProgressCard({ book, progress }: { book: LibraryEntry; progress: BookReadingProgress }) {
  const area = book.area ? AREA_OF_CATEGORY[book.area] : "men";
  const color = BRAIN_AREA_COLOR[area];
  return (
    <Link
      to={`/library/leer/${book.id}`}
      className="flex items-center gap-4 rounded-2xl p-4 no-underline"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <BookCoverMini area={area} title={book.title} />
      <div className="flex min-w-0 flex-col gap-2">
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>{book.title ?? "Sin título"}</span>
        <div style={{ width: 160, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }}>
          <div style={{ width: `${progress.percent}%`, height: 4, borderRadius: 2, background: color }} />
        </div>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>{progress.percent}%</span>
      </div>
    </Link>
  );
}

function SchoolChallengeInProgressCard({ school }: { school: LibrarySchool }) {
  return (
    <Link
      to={`/library/escuela/${school.id}`}
      className="flex flex-col gap-3 rounded-2xl p-4 no-underline"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>
        Reto {school.name.toLowerCase()} · día {school.currentDay} de 7
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            style={{ flex: 1, height: 6, borderRadius: 3, background: i < school.currentDay ? "#FDE68A" : "rgba(255,255,255,0.1)" }}
          />
        ))}
      </div>
    </Link>
  );
}

/** "CONTINUAR" (Fase 1, punto 3c) — hasta 2 tarjetas: la lectura en curso y el reto de escuela en curso, cada una solo si existe. Sin ninguna de las dos, no se muestra nada. */
export function ContinueSection({
  inProgressBook,
  inProgressBookProgress,
  inProgressSchool,
}: {
  inProgressBook: LibraryEntry | null;
  inProgressBookProgress: BookReadingProgress | null;
  inProgressSchool: LibrarySchool | null;
}) {
  if (!inProgressBook && !inProgressSchool) return null;

  return (
    <div className="flex flex-col gap-3">
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>CONTINUAR</span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {inProgressBook && inProgressBookProgress && <ReadingInProgressCard book={inProgressBook} progress={inProgressBookProgress} />}
        {inProgressSchool && <SchoolChallengeInProgressCard school={inProgressSchool} />}
      </div>
    </div>
  );
}
