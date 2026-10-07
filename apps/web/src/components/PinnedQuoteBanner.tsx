import type { LibraryEntry } from "../api/library";
import { INSIGHT_COLOR } from "../domain";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

function remainingLabel(pinnedUntil: string): string {
  const remainingMs = new Date(pinnedUntil).getTime() - Date.now();
  if (remainingMs <= 0) return "vence en instantes";
  const days = Math.ceil(remainingMs / MS_PER_DAY);
  if (days >= 1) return `queda${days === 1 ? "" : "n"} ${days} día${days === 1 ? "" : "s"}`;
  const hours = Math.max(1, Math.ceil(remainingMs / MS_PER_HOUR));
  return `queda${hours === 1 ? "" : "n"} ${hours} hora${hours === 1 ? "" : "s"}`;
}

/**
 * Frase elegida a mano desde la Biblioteca (sección Frases → "Anclar en
 * Seguimiento") en vez de la frase aleatoria de Welcome.tsx: se queda fija
 * acá hasta que vence el plazo elegido o se desancla a mano.
 */
export function PinnedQuoteBanner({ quote, onUnpin }: { quote: LibraryEntry; onUnpin: () => void }) {
  return (
    <div
      className="panel-card-in flex items-start justify-between gap-3 rounded-2xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)", borderLeft: `3px solid ${INSIGHT_COLOR}` }}
    >
      <div className="min-w-0">
        <p className="font-reading text-sm italic sm:text-base" style={{ color: "var(--text)" }}>
          “{quote.content}”
        </p>
        <p className="mt-1.5 text-xs" style={{ color: "var(--text-2)" }}>
          {quote.author && <span>— {quote.author} · </span>}
          📌 {remainingLabel(quote.pinnedUntil!)}
        </p>
      </div>
      <button
        type="button"
        onClick={onUnpin}
        className="shrink-0 rounded-lg border px-2.5 py-1 text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
      >
        Desanclar
      </button>
    </div>
  );
}
