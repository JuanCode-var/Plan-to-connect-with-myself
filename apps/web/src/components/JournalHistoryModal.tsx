import { useEffect, useState } from "react";
import { EMOTIONS, GRATITUDE_COLOR, INSIGHT_COLOR, type Emotion } from "../domain";
import { useJournalEntries, type JournalEntry } from "../api/journal";

export type JournalHistoryKind = "emotion" | "knowledge" | "gratitude";

const MODAL_TITLE: Record<JournalHistoryKind, string> = {
  emotion: "Todos los registros emocionales",
  knowledge: "Todas las reflexiones",
  gratitude: "Todo lo que agradeciste",
};

function EmotionEntryCard({ entry, delay }: { entry: JournalEntry; delay: number }) {
  return (
    <li
      className="mosaic-card panel-card panel-card-in rounded-2xl border p-3 pt-4"
      style={{ background: "var(--bg)", borderColor: "var(--border)", "--tile-accent": "var(--accent)", animationDelay: `${delay}ms` } as React.CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono-num font-medium">{entry.date.slice(0, 10)}</span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {entry.emotion}
        </span>
      </div>
      {entry.situation && (
        <p className="mt-1 text-sm">
          <b>Qué ocurrió:</b> {entry.situation}
        </p>
      )}
      {entry.feeling && (
        <p className="text-sm">
          <b>Qué sentí:</b> {entry.feeling}
        </p>
      )}
      {entry.impulse && (
        <p className="text-sm">
          <b>Qué impulso:</b> {entry.impulse}
        </p>
      )}
      {entry.decision && (
        <p className="text-sm">
          <b>Qué decisión:</b> {entry.decision}
        </p>
      )}
      {entry.learning && (
        <p className="text-sm">
          <b>Qué aprendí:</b> {entry.learning}
        </p>
      )}
    </li>
  );
}

function KnowledgeEntryCard({ entry, delay }: { entry: JournalEntry; delay: number }) {
  return (
    <li
      className="mosaic-card panel-card panel-card-in rounded-2xl border p-3 pt-4"
      style={{ background: "var(--bg)", borderColor: "var(--border)", "--tile-accent": INSIGHT_COLOR, animationDelay: `${delay}ms` } as React.CSSProperties}
    >
      <span className="font-mono-num text-xs font-medium" style={{ color: "var(--text-2)" }}>
        {entry.date.slice(0, 10)}
      </span>
      <p className="mt-1 text-sm whitespace-pre-line" style={{ color: "var(--text)" }}>
        {entry.knowledge}
      </p>
    </li>
  );
}

function GratitudeEntryCard({ entry, delay }: { entry: JournalEntry; delay: number }) {
  return (
    <li
      className="mosaic-card panel-card panel-card-in rounded-2xl border p-3 pt-4"
      style={{ background: "var(--bg)", borderColor: "var(--border)", "--tile-accent": GRATITUDE_COLOR, animationDelay: `${delay}ms` } as React.CSSProperties}
    >
      <span className="font-mono-num text-xs font-medium" style={{ color: "var(--text-2)" }}>
        {entry.date.slice(0, 10)}
      </span>
      <p className="mt-1 text-sm whitespace-pre-line" style={{ color: "var(--text)" }}>
        {entry.gratitude}
      </p>
    </li>
  );
}

/**
 * Vista aparte para ver el historial completo, en vez de mostrar la lista
 * siempre debajo del formulario (lo que hacía la página larga e incómoda de
 * usar a diario). Se abre con el botón "Ver todos los registros" y reusa el
 * mismo estilo de overlay con blur que LibraryReader (Library.tsx).
 */
export function JournalHistoryModal({
  kind,
  onClose,
}: {
  kind: JournalHistoryKind;
  onClose: () => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [emotion, setEmotion] = useState<Emotion | "">("");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const {
    data: entries,
    isLoading,
    isError,
  } = useJournalEntries({
    from: from || undefined,
    to: to || undefined,
    emotion: kind === "emotion" && emotion ? emotion : undefined,
    kind,
  });

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="reader-backdrop absolute inset-0 overflow-y-auto p-4 pt-8 sm:p-8 sm:pt-12"
        onClick={onClose}
      >
        <article
          className="reader-card-in mx-auto mb-10 max-w-5xl overflow-hidden rounded-2xl border shadow-2xl"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <header
            className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-6 py-4 sm:px-8"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h2 className="font-display text-lg font-bold sm:text-xl">{MODAL_TITLE[kind]}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              Cerrar
            </button>
          </header>

          <div className="flex flex-col gap-4 px-6 py-6 sm:px-8">
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
                Desde
                <input
                  type="date"
                  className="rounded-lg border p-2"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
                Hasta
                <input
                  type="date"
                  className="rounded-lg border p-2"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
              {kind === "emotion" && (
                <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
                  Emoción
                  <select
                    className="rounded-lg border p-2"
                    style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value as Emotion | "")}
                  >
                    <option value="">Todas</option>
                    {EMOTIONS.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {isLoading && <p style={{ color: "var(--text-2)" }}>Cargando…</p>}
            {isError && <p className="text-red-500">No se pudo cargar el historial.</p>}
            {entries && entries.length === 0 && <p style={{ color: "var(--text-2)" }}>Sin registros.</p>}

            <ul className="mosaic-wall columns-1 sm:columns-2 lg:columns-3">
              {entries?.map((entry, i) => {
                const delay = Math.min(i, 10) * 40;
                if (kind === "emotion") return <EmotionEntryCard key={entry.id} entry={entry} delay={delay} />;
                if (kind === "gratitude") return <GratitudeEntryCard key={entry.id} entry={entry} delay={delay} />;
                return <KnowledgeEntryCard key={entry.id} entry={entry} delay={delay} />;
              })}
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
