import { useState } from "react";
import { todayISO } from "../lib/date";
import { formatShortDate } from "../lib/journalDate";
import { NEURAL_BG, NEURAL_CARD_BORDER, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

/**
 * "Hoy, 13 nov" (Paso 1 del rediseño) — texto por defecto, se toca para
 * abrir el selector nativo y anotar un día pasado. `max` en hoy: el Diario
 * no registra el futuro.
 */
export function JournalDatePicker({ date, onChange }: { date: string; onChange: (date: string) => void }) {
  const [editing, setEditing] = useState(false);
  const today = todayISO();

  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        value={date}
        max={today}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value);
          setEditing(false);
        }}
        onBlur={() => setEditing(false)}
        className="rounded-lg border px-2 py-1 text-sm"
        style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT_SECONDARY }}
      />
    );
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
      {date === today ? `Hoy, ${formatShortDate(date)}` : formatShortDate(date)}
    </button>
  );
}
