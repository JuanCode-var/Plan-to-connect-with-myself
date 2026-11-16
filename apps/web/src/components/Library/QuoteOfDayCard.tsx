import { useState } from "react";
import { usePinLibraryEntry, type LibraryEntry } from "../../api/library";
import { NEURAL_FONT_BODY, NEURAL_FONT_READING, NEURAL_LAVENDER } from "../NeuralCore/tokens";

function isCurrentlyPinned(entry: LibraryEntry): boolean {
  return !!entry.pinnedUntil && new Date(entry.pinnedUntil) > new Date();
}

/**
 * "FRASE DEL DÍA" (Fase 1, punto 3b) — pickDailyQuote (forYouSelectors.ts)
 * elige cuál. "Anclar en Seguimiento" reutiliza TAL CUAL el mecanismo que
 * ya existe (POST /library/:id/pin, ver PinnedQuoteBanner.tsx) — un día de
 * default en vez del selector de duración de la Biblioteca vieja, porque
 * acá es un solo botón, no un panel.
 */
export function QuoteOfDayCard({ quote }: { quote: LibraryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const pinEntry = usePinLibraryEntry();
  const pinned = isCurrentlyPinned(quote);

  return (
    <div className="flex flex-col gap-4 rounded-2xl p-5" style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.3)" }}>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>FRASE DEL DÍA</span>
      <p className="m-0" style={{ fontFamily: NEURAL_FONT_READING, fontStyle: "italic", fontSize: 22, lineHeight: 1.45, color: "#FFFFFF" }}>
        “{quote.content}”
      </p>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_LAVENDER }}>— {quote.author ?? "Autor por confirmar"}</span>

      {expanded && (
        <p
          className="m-0"
          style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, lineHeight: 1.5, color: "#E6E9F5", animation: "insight-in .4s ease" }}
        >
          Lleva esta frase contigo hoy — vuelve a leerla cuando la necesites, antes de una decisión o al cerrar el día.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs font-semibold" style={{ color: NEURAL_LAVENDER }}>
          {expanded ? "Ocultar" : "Llévala a tu día"}
        </button>
        <button
          type="button"
          disabled={pinEntry.isPending}
          onClick={() => !pinned && pinEntry.mutate({ id: quote.id, duration: "DAY" })}
          className="text-xs font-semibold disabled:opacity-60"
          style={{ color: pinned ? "#22D3EE" : NEURAL_LAVENDER }}
        >
          {pinned ? "✓ Anclada" : "Anclar en Seguimiento"}
        </button>
      </div>
    </div>
  );
}
