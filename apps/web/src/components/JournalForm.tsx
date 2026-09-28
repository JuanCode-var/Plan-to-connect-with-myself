import { useState } from "react";
import { EMOTIONS, type Emotion } from "../domain";
import { useCreateJournalEntry } from "../api/journal";
import { todayISO } from "../lib/date";

export function JournalForm({ initialDate }: { initialDate?: string }) {
  const [date, setDate] = useState(initialDate ?? todayISO());
  const [emotion, setEmotion] = useState<Emotion>("Ansiedad");
  const [situation, setSituation] = useState("");
  const [feeling, setFeeling] = useState("");
  const [impulse, setImpulse] = useState("");
  const [decision, setDecision] = useState("");
  const [learning, setLearning] = useState("");
  const createEntry = useCreateJournalEntry();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createEntry.mutate(
      {
        date,
        emotion,
        situation: situation.trim() || undefined,
        feeling: feeling.trim() || undefined,
        impulse: impulse.trim() || undefined,
        decision: decision.trim() || undefined,
        learning: learning.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSituation("");
          setFeeling("");
          setImpulse("");
          setDecision("");
          setLearning("");
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <h2 className="font-display font-semibold">Nuevo registro emocional</h2>

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
          Fecha
          <input
            type="date"
            className="rounded-lg border p-2"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
          Emoción principal
          <select
            className="rounded-lg border p-2"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            value={emotion}
            onChange={(e) => setEmotion(e.target.value as Emotion)}
          >
            {EMOTIONS.map((em) => (
              <option key={em} value={em}>
                {em}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Qué ocurrió
        <textarea
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          rows={2}
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Qué sentí
        <textarea
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          rows={2}
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Qué impulso apareció
        <textarea
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          rows={2}
          value={impulse}
          onChange={(e) => setImpulse(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Qué decisión tomé
        <textarea
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          rows={2}
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Qué aprendí
        <textarea
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          rows={2}
          value={learning}
          onChange={(e) => setLearning(e.target.value)}
        />
      </label>

      <button
        type="submit"
        disabled={createEntry.isPending}
        className="self-start rounded-lg px-3 py-1.5 text-sm font-semibold"
        style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
      >
        Guardar registro
      </button>
    </form>
  );
}
