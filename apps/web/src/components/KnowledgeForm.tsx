import { useState } from "react";
import { useCreateJournalEntry } from "../api/journal";
import { todayISO } from "../lib/date";

// Sección separada del check-in emocional: acá no hace falta pasar por una
// situación ni elegir una emoción, solo anotar algo que aprendiste, leíste o
// pensaste hoy. Por eso la entrada se guarda sin `emotion` (ver journal.ts).
export function KnowledgeForm({ initialDate }: { initialDate?: string }) {
  const [date, setDate] = useState(initialDate ?? todayISO());
  const [content, setContent] = useState("");
  const createEntry = useCreateJournalEntry();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    createEntry.mutate(
      { date, knowledge: content.trim() },
      { onSuccess: () => setContent("") },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-semibold">Nueva reflexión</h2>
        <input
          type="date"
          className="rounded-lg border p-1.5 text-sm"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <textarea
        className="rounded-lg border p-2 text-sm"
        style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
        rows={4}
        placeholder="Algo que aprendiste, descubriste o pensaste hoy — de un libro, una charla, una idea que se te ocurrió..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button
        type="submit"
        disabled={createEntry.isPending || !content.trim()}
        className="self-start rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
        style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
      >
        {createEntry.isPending ? "Guardando…" : "Guardar reflexión"}
      </button>
    </form>
  );
}
