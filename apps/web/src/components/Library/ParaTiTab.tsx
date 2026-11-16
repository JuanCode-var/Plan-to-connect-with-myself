import { useMemo } from "react";
import { useBookReadingProgress, useLibrarySchools, type LibraryEntry } from "../../api/library";
import { todayISO } from "../../lib/date";
import { AREA_OF_CATEGORY } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { BookForYouCard } from "./BookForYouCard";
import { ContinueSection } from "./ContinueSection";
import { DoseBanner } from "./DoseBanner";
import { pickDailyQuote, selectBookForYou, type BookCandidate } from "./forYouSelectors";
import { QuoteOfDayCard } from "./QuoteOfDayCard";
import { useDailyDose } from "./useDailyDose";
import type { useCycleResonance } from "../CycleResonance/useCycleResonance";

type Resonance = ReturnType<typeof useCycleResonance>;

export function ParaTiTab({ resonance, entries }: { resonance: Resonance; entries: LibraryEntry[] }) {
  const dailyDose = useDailyDose(resonance);
  const { data: readingProgress } = useBookReadingProgress();
  const { data: schools } = useLibrarySchools();

  const books = useMemo(() => entries.filter((e) => e.section === "LIBRO"), [entries]);
  const quotes = useMemo(() => entries.filter((e) => e.section === "FRASE"), [entries]);

  const byAreaPercent = useMemo(() => Object.fromEntries(resonance.byArea.map((a) => [a.area, a.percent])), [resonance.byArea]);

  const bookForYou = useMemo(() => {
    const candidates: BookCandidate[] = books.map((b) => ({
      id: b.id,
      area: b.area ? AREA_OF_CATEGORY[b.area] : null,
      status: readingProgress?.find((p) => p.entryId === b.id)?.status ?? "NUEVO",
    }));
    const selection = selectBookForYou(byAreaPercent, candidates);
    if (!selection) return null;
    const book = books.find((b) => b.id === selection.bookId);
    return book ? { book, area: selection.area } : null;
  }, [books, byAreaPercent, readingProgress]);

  const quoteOfDay = useMemo(() => pickDailyQuote([...quotes].sort((a, b) => a.id.localeCompare(b.id)), todayISO()), [quotes]);

  const inProgressBookProgress = readingProgress?.find((p) => p.status === "EN_PROGRESO") ?? null;
  const inProgressBook = inProgressBookProgress ? (books.find((b) => b.id === inProgressBookProgress.entryId) ?? null) : null;
  const inProgressSchool = schools?.find((s) => s.currentDay > 0 && s.currentDay < 7) ?? null;

  return (
    <div className="flex flex-col gap-7">
      {dailyDose.ready && (
        <DoseBanner doseId={dailyDose.dose?.id ?? null} hookText={dailyDose.hookText} streak={dailyDose.streak} completedToday={dailyDose.completedToday} />
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_1fr]">
        {bookForYou ? (
          <BookForYouCard book={bookForYou.book} area={bookForYou.area} />
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-5 text-center"
            style={{ borderColor: "rgba(255,255,255,0.14)" }}
          >
            <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
              PARA TI HOY
            </span>
            <p className="m-0" style={{ color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY, fontSize: 13 }}>
              Todavía no hay ningún libro con área asignada — en cuanto le pongas área a uno, aparece acá.
            </p>
          </div>
        )}
        {quoteOfDay ? (
          <QuoteOfDayCard quote={quoteOfDay} />
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-5 text-center"
            style={{ borderColor: "rgba(255,255,255,0.14)" }}
          >
            <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
              FRASE DEL DÍA
            </span>
            <p className="m-0" style={{ color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY, fontSize: 13 }}>
              Todavía no hay frases cargadas.
            </p>
          </div>
        )}
      </div>

      <ContinueSection inProgressBook={inProgressBook} inProgressBookProgress={inProgressBookProgress} inProgressSchool={inProgressSchool ?? null} />
    </div>
  );
}
