import { useState } from "react";
import { useCreateGratitudeEntries } from "../api/journal";
import { JournalDatePicker } from "./JournalDatePicker";
import { NEURAL_BG, NEURAL_CYAN, NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import { todayISO } from "../lib/date";

const GOLD_INK = "#3A2E05";

/**
 * "Gratitud" (mockup 17f) — a diferencia de Registro emocional/Conocimientos,
 * es un ritual de una vez al día: guardar no abre un "nuevo registro", deja
 * el botón en "✓ Guardado" y las líneas tal cual quedaron. Cambiar la fecha
 * a otro día sí vuelve a habilitar el formulario (es un día distinto).
 */
export function GratitudeCard() {
  const [date, setDate] = useState(todayISO());
  const [items, setItems] = useState(["", "", ""]);
  const [savedForDate, setSavedForDate] = useState<string | null>(null);
  const [habitMessage, setHabitMessage] = useState<string | null>(null);

  const createGratitude = useCreateGratitudeEntries();
  const filledCount = items.filter((i) => i.trim()).length;
  const isSaved = savedForDate === date;

  function updateItem(i: number, value: string) {
    setItems((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  }

  function handleSave() {
    const nonEmpty = items.map((i) => i.trim()).filter(Boolean);
    if (nonEmpty.length === 0) return;
    createGratitude.mutate(
      { date, items: nonEmpty },
      {
        onSuccess: (result) => {
          setSavedForDate(date);
          setHabitMessage(
            result.habitMarked
              ? `Guardado. También marcamos tu hábito “${result.habitMarked.name}” · ${result.habitMarked.streak} días seguidos.`
              : "Guardado.",
          );
        },
      },
    );
  }

  function handleDateChange(next: string) {
    setDate(next);
    if (next !== savedForDate) {
      setItems(["", "", ""]);
      setHabitMessage(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: NEURAL_LAVENDER }}>
          Gratitud
        </span>
        <JournalDatePicker date={date} onChange={handleDateChange} />
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="font-display m-0 text-2xl font-bold sm:text-[28px]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
          Tres cosas que agradeces hoy
        </h2>
        <p className="font-reading m-0 text-base italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_LAVENDER }}>
          Grande o pequeña. Una persona, algo que pasó, algo que tienes.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((value, i) => {
          const filled = value.trim().length > 0;
          return (
            <div key={i} className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors"
                style={{ background: filled ? NEURAL_GOLD : "rgba(255,255,255,.08)", color: filled ? GOLD_INK : NEURAL_TEXT_SECONDARY }}
              >
                {i + 1}
              </span>
              <input
                value={value}
                disabled={isSaved}
                onChange={(e) => updateItem(i, e.target.value)}
                className="font-reading min-w-0 flex-1 rounded-xl border p-3 text-base disabled:opacity-70"
                style={{ background: NEURAL_BG, borderColor: "rgba(255,255,255,.14)", color: NEURAL_TEXT, fontFamily: "'Lora', Georgia, serif" }}
              />
            </div>
          );
        })}
      </div>

      {isSaved && habitMessage && (
        <div className="goal-achieved-in flex items-center gap-3 rounded-xl p-3.5" style={{ background: "rgba(253,230,138,.08)", border: "1px solid rgba(253,230,138,.3)" }}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: NEURAL_GOLD, color: GOLD_INK }}>
            ✓
          </span>
          <p className="m-0 text-sm" style={{ color: NEURAL_TEXT }}>
            {habitMessage}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          {filledCount} de 3
        </span>
        <button
          type="button"
          disabled={isSaved || filledCount === 0 || createGratitude.isPending}
          onClick={handleSave}
          className="rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          style={isSaved ? { background: "rgba(255,255,255,.08)", color: NEURAL_TEXT_SECONDARY } : { background: NEURAL_CYAN, color: "#070B1F" }}
        >
          {isSaved ? "✓ Guardado" : createGratitude.isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>

      {createGratitude.isError && (
        <p className="text-sm" style={{ color: "#F87171" }}>
          No se pudo guardar.
        </p>
      )}
    </div>
  );
}
