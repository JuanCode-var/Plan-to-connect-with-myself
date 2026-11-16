import { useMemo, useState } from "react";
import { useUnlockedQuotes, usePinLibraryEntry, type LibraryEntry } from "../../api/library";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_FONT_READING, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#A9B1D6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

function UnlockedQuoteCard({ quote }: { quote: LibraryEntry }) {
  const [pinnedJustNow, setPinnedJustNow] = useState(false);
  const pinEntry = usePinLibraryEntry();
  const pinned = pinnedJustNow || (!!quote.pinnedUntil && new Date(quote.pinnedUntil) > new Date());

  return (
    <div
      className="flex flex-col gap-3 rounded-r-xl p-4"
      style={{ background: "rgba(167,139,250,0.05)", borderLeft: "3px solid #A78BFA" }}
    >
      <p className="m-0" style={{ fontFamily: NEURAL_FONT_READING, fontStyle: "italic", fontSize: 19, lineHeight: 1.45, color: "#FFFFFF" }}>
        “{quote.content}”
      </p>
      <div className="flex items-center justify-between gap-2">
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>{quote.author ?? "Autor por confirmar"}</span>
        <button
          type="button"
          disabled={pinEntry.isPending}
          onClick={() => {
            pinEntry.mutate({ id: quote.id, duration: "DAY" });
            setPinnedJustNow(true);
          }}
          className="text-xs font-semibold disabled:opacity-60"
          style={{ color: "#22D3EE" }}
        >
          {pinned ? "✓ Anclada" : "Anclar"}
        </button>
      </div>
    </div>
  );
}

function LockedQuoteCard() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-r-xl p-6 text-center"
      style={{ background: "rgba(167,139,250,0.03)", borderLeft: "3px solid rgba(167,139,250,0.25)", minHeight: 120 }}
    >
      <LockIcon />
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>Se desbloquea completando dosis</span>
    </div>
  );
}

/** Pestaña "Frases" (Fase 1, punto 5) — colección X de N, bloqueadas sin revelar su contenido. */
export function FrasesTab({ quotes }: { quotes: LibraryEntry[] }) {
  const { data: unlocked } = useUnlockedQuotes();
  const unlockedIds = useMemo(() => new Set((unlocked ?? []).map((u) => u.entryId)), [unlocked]);

  return (
    <div className="flex flex-col gap-5">
      <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>
        Colección {unlockedIds.size} de {quotes.length}
      </span>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quotes.map((quote) => (unlockedIds.has(quote.id) ? <UnlockedQuoteCard key={quote.id} quote={quote} /> : <LockedQuoteCard key={quote.id} />))}
      </div>
    </div>
  );
}
