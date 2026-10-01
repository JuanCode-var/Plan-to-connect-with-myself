import { useState } from "react";
import { useJournalEntries } from "../api/journal";
import { INSIGHT_COLOR } from "../domain";

export function KnowledgeList() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const {
    data: entries,
    isLoading,
    isError,
  } = useJournalEntries({ from: from || undefined, to: to || undefined, kind: "knowledge" });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>
          Historial de reflexiones
        </h3>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
            Desde
            <input
              type="date"
              className="rounded-lg border p-2"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
            Hasta
            <input
              type="date"
              className="rounded-lg border p-2"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
      </div>

      {isLoading && <p style={{ color: "var(--text-2)" }}>Cargando…</p>}
      {isError && <p className="text-red-500">No se pudo cargar el historial.</p>}
      {entries && entries.length === 0 && <p style={{ color: "var(--text-2)" }}>Todavía no hay reflexiones.</p>}

      <ul className="mosaic-wall columns-1 sm:columns-2 lg:columns-3">
        {entries?.map((entry) => (
          <li
            key={entry.id}
            className="mosaic-card panel-card rounded-2xl border p-3 pt-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)", "--tile-accent": INSIGHT_COLOR } as React.CSSProperties}
          >
            <span className="font-mono-num text-xs font-medium" style={{ color: "var(--text-2)" }}>
              {entry.date.slice(0, 10)}
            </span>
            <p className="mt-1 text-sm whitespace-pre-line" style={{ color: "var(--text)" }}>
              {entry.knowledge}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
