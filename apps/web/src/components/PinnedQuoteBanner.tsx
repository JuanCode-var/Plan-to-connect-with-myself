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
      className="panel-card-in flex h-full flex-col justify-between gap-4 rounded-2xl border p-5"
      style={{
        background: `linear-gradient(160deg, var(--accent-soft), var(--surface) 55%)`,
        borderColor: "var(--border)",
      }}
    >
      <div className="min-w-0">
        <span className="text-2xl leading-none" style={{ color: INSIGHT_COLOR }} aria-hidden>
          &ldquo;
        </span>
        <p className="font-reading text-sm italic sm:text-base" style={{ color: "var(--text)" }}>
          {quote.content}
        </p>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-xs" style={{ color: "var(--text-2)" }}>
          {quote.author && <span>— {quote.author} · </span>}
          📌 {remainingLabel(quote.pinnedUntil!)}
        </p>
        <button
          type="button"
          onClick={onUnpin}
          className="shrink-0 rounded-lg border px-2.5 py-1 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
        >
          Desanclar
        </button>
      </div>
    </div>
  );
}
