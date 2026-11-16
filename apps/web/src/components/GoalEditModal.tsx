import { useEffect, useState } from "react";
import { useDeleteGoal, useUpdateGoal, type Goal } from "../api/goals";
import type { HabitCategory } from "../domain";
import { BRAIN_AREAS, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, CATEGORY_OF_AREA } from "./NeuralCore/brainTokens";
import { NEURAL_BG, NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_CYAN_SOFT, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

function fieldClass() {
  return "rounded-lg border p-2.5 text-sm";
}

/**
 * Edición de una meta — reemplaza el checklist de pasos y las 5 fases de
 * GoalDetailModal por los mismos campos del asistente de creación, todos
 * juntos y editables de una (sin pasos por guardar uno por uno, a
 * diferencia de "+1"/"Restar 1" que viven en la tarjeta misma).
 */
export function GoalEditModal({
  goal,
  cycleId,
  cycleStartDate,
  cycleEndDate,
  onClose,
}: {
  goal: Goal;
  cycleId: string;
  cycleStartDate: string;
  cycleEndDate: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(goal.title);
  const [area, setArea] = useState<HabitCategory | null>(goal.area);
  const [why, setWhy] = useState(goal.why ?? "");
  const [visualization, setVisualization] = useState(goal.visualization ?? "");
  const [targetCount, setTargetCount] = useState(goal.targetCount);
  const [unit, setUnit] = useState(goal.unit);
  const [targetDate, setTargetDate] = useState(goal.targetDate.slice(0, 10));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal(cycleId);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSave() {
    if (!title.trim() || !area || !unit.trim() || targetCount < 1 || !targetDate) return;
    updateGoal.mutate(
      {
        id: goal.id,
        cycleId,
        data: {
          title: title.trim(),
          area,
          why,
          visualization,
          targetCount,
          unit: unit.trim(),
          targetDate,
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="reader-backdrop absolute inset-0 overflow-y-auto p-4 pt-8 sm:p-8 sm:pt-12" onClick={onClose}>
        <article
          className="reader-card-in mx-auto mb-10 max-w-xl overflow-hidden rounded-2xl border shadow-2xl"
          style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
          onClick={(e) => e.stopPropagation()}
        >
          <header
            className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-6 py-4 sm:px-8"
            style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER }}
          >
            <h2 className="font-display text-lg font-bold sm:text-xl">Editar meta</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold"
              style={{ background: NEURAL_CYAN_SOFT, color: NEURAL_CYAN }}
            >
              Cerrar
            </button>
          </header>

          <div className="flex flex-col gap-4 px-6 py-6 sm:px-8">
            <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              ¿Qué quieres lograr?
              <input
                className={fieldClass()}
                style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <div className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Área
              <div className="flex flex-wrap gap-2">
                {BRAIN_AREAS.map((brainArea) => {
                  const category = CATEGORY_OF_AREA[brainArea];
                  const color = BRAIN_AREA_COLOR[brainArea];
                  const selected = area === category;
                  return (
                    <button
                      key={brainArea}
                      type="button"
                      onClick={() => setArea(category)}
                      className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                      style={{
                        borderColor: selected ? color : NEURAL_CARD_BORDER,
                        background: selected ? `${color}1F` : "transparent",
                        color: selected ? color : NEURAL_TEXT,
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      {BRAIN_AREA_LABEL[brainArea]}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              ¿Por qué te importa?
              <textarea
                className={fieldClass()}
                style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                rows={2}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Visualización
              <textarea
                className={fieldClass()}
                style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                value={visualization}
                onChange={(e) => setVisualization(e.target.value)}
                rows={2}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Objetivo
                <input
                  type="number"
                  min={1}
                  step={1}
                  className={fieldClass()}
                  style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                  value={targetCount}
                  onChange={(e) => setTargetCount(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Unidad
                <input
                  className={fieldClass()}
                  style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Fecha límite
              <input
                type="date"
                className={fieldClass()}
                style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                value={targetDate}
                min={cycleStartDate.slice(0, 10)}
                max={cycleEndDate.slice(0, 10)}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateGoal.isPending || !title.trim() || !area || !unit.trim()}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
                style={{ background: NEURAL_CYAN, color: NEURAL_BG }}
              >
                Guardar
              </button>
              {updateGoal.isError && <span className="text-xs text-red-500">No se pudo guardar.</span>}
            </div>

            <div className="mt-2 border-t pt-4" style={{ borderColor: NEURAL_CARD_BORDER }}>
              {!confirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="text-xs underline"
                  style={{ color: "#F87171" }}
                >
                  Eliminar meta
                </button>
              ) : (
                <div className="panel-expand-in rounded-xl border p-3" style={{ borderColor: NEURAL_CARD_BORDER }}>
                  <p className="text-sm">¿Eliminar esta meta?</p>
                  <p className="mt-1 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                    Esta acción no se puede deshacer.
                  </p>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded-lg border px-3 py-1.5 text-xs"
                      style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT_SECONDARY }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={deleteGoal.isPending}
                      onClick={() => deleteGoal.mutate(goal.id, { onSuccess: onClose })}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      style={{ background: "#B91C1C" }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
