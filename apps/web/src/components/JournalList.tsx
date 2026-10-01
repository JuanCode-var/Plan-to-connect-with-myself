import { EMOTIONS, type Emotion } from "../domain";
import { useJournalEntries } from "../api/journal";

export function JournalList({
  from,
  to,
  emotion,
  onFromChange,
  onToChange,
  onEmotionChange,
}: {
  from: string;
  to: string;
  emotion: Emotion | "";
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onEmotionChange: (v: Emotion | "") => void;
}) {
  const {
    data: entries,
    isLoading,
    isError,
  } = useJournalEntries({
    from: from || undefined,
    to: to || undefined,
    emotion: emotion || undefined,
    kind: "emotion",
  });

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display font-semibold">Historial</h2>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
          Desde
          <input
            type="date"
            className="rounded-lg border p-2"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
          Hasta
          <input
            type="date"
            className="rounded-lg border p-2"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
            value={to}
            onChange={(e) => onToChange(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
          Emoción
          <select
            className="rounded-lg border p-2"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
            value={emotion}
            onChange={(e) => onEmotionChange(e.target.value as Emotion | "")}
          >
            <option value="">Todas</option>
            {EMOTIONS.map((em) => (
              <option key={em} value={em}>
                {em}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p style={{ color: "var(--text-2)" }}>Cargando…</p>}
      {isError && <p className="text-red-500">No se pudo cargar el historial.</p>}
      {entries && entries.length === 0 && <p style={{ color: "var(--text-2)" }}>Sin registros.</p>}

      <ul className="mosaic-wall columns-1 sm:columns-2 lg:columns-3">
        {entries?.map((entry) => (
          <li
            key={entry.id}
            className="mosaic-card panel-card rounded-2xl border p-3 pt-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)", "--tile-accent": "var(--accent)" } as React.CSSProperties}
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
            {entry.knowledge && (
              <p className="text-sm">
                <b>Conocimientos del día:</b> {entry.knowledge}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
