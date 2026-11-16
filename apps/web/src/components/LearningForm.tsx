import { useEffect, useState } from "react";
import { useHabits } from "../api/habits";
import { useCreateLearning } from "../api/microActions";
import { HABIT_CATEGORIES, HABIT_CATEGORY_LABELS, type HabitCategory } from "../domain";
import { NEURAL_BG, NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

/**
 * "+ Nuevo aprendizaje" — no está en ninguno de los mockups (ahí los
 * aprendizajes ya existen), pero hace falta un lugar para crearlos. Mismo
 * patrón de modal que JournalHistoryModal.tsx (backdrop + Escape +
 * `role="dialog"`), retemado a los tokens de Núcleo Neural.
 */
export function LearningForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<HabitCategory>("EMOCIONAL");
  const [source, setSource] = useState("");
  const [keyIdea, setKeyIdea] = useState("");
  const [habitId, setHabitId] = useState("");
  const createLearning = useCreateLearning();
  const { data: habits } = useHabits();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createLearning.mutate(
      {
        title: title.trim(),
        area,
        source: source.trim() || null,
        keyIdea: keyIdea.trim() || null,
        habitId: habitId || null,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 flex items-start justify-center overflow-y-auto p-4 pt-16 sm:p-8 sm:pt-24"
        style={{ background: "rgba(5,5,9,0.72)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <form
          role="dialog"
          aria-labelledby="learning-form-titulo"
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
          className="flex w-full max-w-md flex-col gap-4 rounded-[20px] border p-7"
          style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          <h2 id="learning-form-titulo" className="m-0 text-xl font-extrabold" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
            Nuevo aprendizaje
          </h2>

          <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Título
            <input
              className="rounded-xl border p-2.5"
              style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Área
            <select
              className="rounded-xl border p-2.5"
              style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              value={area}
              onChange={(e) => setArea(e.target.value as HabitCategory)}
            >
              {HABIT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {HABIT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Asociar con hábito (opcional)
            <select
              className="rounded-xl border p-2.5"
              style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              value={habitId}
              onChange={(e) => setHabitId(e.target.value)}
            >
              <option value="">Sin asociar</option>
              {habits?.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Al marcar cumplido ese hábito, va a ofrecer este aprendizaje para registrar cómo lo aplicaste.
            </span>
          </label>

          <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Fuente (libro, curso, podcast… — opcional)
            <input
              className="rounded-xl border p-2.5"
              style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Idea clave (opcional)
            <textarea
              className="resize-none rounded-xl border p-2.5 font-reading"
              style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT, fontFamily: "'Lora', Georgia, serif" }}
              rows={3}
              value={keyIdea}
              onChange={(e) => setKeyIdea(e.target.value)}
            />
          </label>

          <div className="mt-1 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border py-3 text-sm font-bold"
              style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT_SECONDARY, background: "transparent" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createLearning.isPending || !title.trim()}
              className="flex-[2] rounded-xl py-3 text-sm font-bold disabled:opacity-60"
              style={{ background: NEURAL_CYAN, color: "#070B1F" }}
            >
              {createLearning.isPending ? "Guardando…" : "Guardar aprendizaje"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
