import { useState } from "react";
import { useCreateJournalEntry } from "../api/journal";
import { todayISO } from "../lib/date";

// Tercera sección independiente del Diario, mismo criterio que
// KnowledgeForm.tsx: sin pasar por una situación ni elegir una emoción, acá
// solo se anota qué agradecés hoy. Se guarda sin `emotion` ni `knowledge`,
// solo `gratitude` (ver journal.ts).
export function GratitudeForm({ initialDate }: { initialDate?: string }) {
  const [date, setDate] = useState(initialDate ?? todayISO());
  const [content, setContent] = useState("");
  const createEntry = useCreateJournalEntry();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    createEntry.mutate(
      { date, gratitude: content.trim() },
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
        <h2 className="font-display font-semibold">Qué agradezco hoy</h2>
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
        placeholder="Una persona, algo que pasó, algo pequeño del día a día — lo que se te ocurra agradecer hoy..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button
        type="submit"
        disabled={createEntry.isPending || !content.trim()}
        className="self-start rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
        style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
      >
        {createEntry.isPending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
