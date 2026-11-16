import { useState } from "react";
import { HABIT_CATEGORIES } from "../domain";
import type { WordCommitmentInput } from "../api/word";
import { AREA_OF_CATEGORY, BRAIN_AREA_LABEL } from "./NeuralCore/brainTokens";
import { NEURAL_BG, NEURAL_CYAN, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import { addDaysISO, todayISO } from "../lib/date";

const fieldStyle = { background: NEURAL_BG, border: "1px solid rgba(255,255,255,0.14)", color: NEURAL_TEXT };

/**
 * "+ Nuevo compromiso" / editar uno existente — formulario propio (el
 * mockup no muestra esta pantalla, así que el layout acá es criterio
 * razonable, no un calco de imagen). `initial` presente = editar (conserva
 * su `id` para que el guardado haga upsert, no cree uno nuevo).
 */
export function WordCommitmentForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: WordCommitmentInput;
  onSave: (input: WordCommitmentInput) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [text, setText] = useState(initial?.text ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate.slice(0, 10) ?? todayISO());
  const [targetDate, setTargetDate] = useState(initial?.targetDate.slice(0, 10) ?? addDaysISO(todayISO(), 90));
  const [area, setArea] = useState(initial?.area ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    onSave({
      id: initial?.id,
      title: title.trim(),
      text: text.trim(),
      startDate,
      targetDate,
      area: area ? (area as WordCommitmentInput["area"]) : null,
    });
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 overflow-y-auto p-4 pt-16 sm:p-8 sm:pt-24" style={{ background: "rgba(5,5,9,0.72)" }} onClick={onCancel}>
        <form
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
          className="mx-auto flex w-full max-w-md flex-col gap-3.5 rounded-[20px] border p-7"
          style={{ background: "#0B0F28", borderColor: "rgba(255,255,255,0.1)" }}
        >
          <h2 className="m-0 text-xl font-extrabold" style={{ color: NEURAL_TEXT }}>
            {initial?.id ? "Editar compromiso" : "Nuevo compromiso"}
          </h2>

          <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Título
            <input className="rounded-xl p-2.5" style={fieldStyle} value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </label>

          <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Tu compromiso, con tus palabras
            <textarea className="resize-none rounded-xl p-2.5" style={fieldStyle} rows={4} value={text} onChange={(e) => setText(e.target.value)} required />
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Desde
              <input type="date" className="rounded-xl p-2.5" style={fieldStyle} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </label>
            <label className="flex flex-1 flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Hasta
              <input type="date" className="rounded-xl p-2.5" style={fieldStyle} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Área (opcional)
            <select className="rounded-xl p-2.5" style={fieldStyle} value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">Sin asociar</option>
              {HABIT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {BRAIN_AREA_LABEL[AREA_OF_CATEGORY[c]]}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-1 flex gap-2.5">
            <button type="button" onClick={onCancel} className="flex-1 rounded-xl border py-3 text-sm font-bold" style={{ borderColor: "rgba(255,255,255,0.18)", color: NEURAL_TEXT_SECONDARY, background: "transparent" }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving || !title.trim() || !text.trim()} className="flex-[2] rounded-xl py-3 text-sm font-bold disabled:opacity-60" style={{ background: NEURAL_CYAN, color: "#070B1F" }}>
              {saving ? "Guardando…" : "Guardar compromiso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
