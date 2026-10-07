import { useEffect, useState } from "react";
import {
  GOAL_STATUSES,
  GOAL_STATUS_LABELS,
  type GoalStatus,
} from "../domain";
import {
  useCreateGoalStep,
  useDeleteGoal,
  useDeleteGoalStep,
  useToggleGoalStep,
  useUpdateGoal,
  type Goal,
} from "../api/goals";

function fieldClass() {
  return "rounded-lg border p-2 text-sm";
}

/**
 * Detalle/edición completa de una meta — las 5 fases de la técnica de
 * visualización y establecimiento de metas, fusionadas con los 3 pasos de
 * Brian Tracy. Reusa el mismo patrón de overlay con blur que
 * JournalHistoryModal/LibraryReader (`reader-backdrop`/`reader-card-in` en
 * index.css) para que todos los "paneles grandes" del app se sientan iguales.
 *
 * Los campos de texto (fases 1-3 y 5) se editan en bloque con un botón
 * "Guardar" — a diferencia del checklist de pasos (fase 4), que se guarda
 * paso por paso al tildar/agregar/borrar, porque esa es la interacción que
 * se usa todos los días y no debería depender de acordarse de guardar.
 */
export function GoalDetailModal({
  goal,
  cycleId,
  onClose,
}: {
  goal: Goal;
  cycleId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(goal.title);
  const [why, setWhy] = useState(goal.why ?? "");
  const [visualization, setVisualization] = useState(goal.visualization ?? "");
  const [specification, setSpecification] = useState(goal.specification);
  const [targetDate, setTargetDate] = useState(goal.targetDate.slice(0, 10));
  const [status, setStatus] = useState<GoalStatus>(goal.status);
  const [followUpNotes, setFollowUpNotes] = useState(goal.followUpNotes ?? "");
  const [celebration, setCelebration] = useState(goal.celebration ?? "");
  const [newStep, setNewStep] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal(cycleId);
  const createStep = useCreateGoalStep(cycleId);
  const toggleStep = useToggleGoalStep(cycleId);
  const deleteStep = useDeleteGoalStep(cycleId);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSave() {
    if (!title.trim() || !specification.trim() || !targetDate) return;
    updateGoal.mutate({
      id: goal.id,
      cycleId,
      data: {
        title: title.trim(),
        why,
        visualization,
        specification: specification.trim(),
        targetDate,
        status,
        followUpNotes,
        celebration,
      },
    });
  }

  function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    if (!newStep.trim()) return;
    createStep.mutate({ goalId: goal.id, description: newStep.trim() }, { onSuccess: () => setNewStep("") });
  }

  const doneSteps = goal.steps.filter((s) => s.done).length;

  return (
    <div className="fixed inset-0 z-50">
      <div className="reader-backdrop absolute inset-0 overflow-y-auto p-4 pt-8 sm:p-8 sm:pt-12" onClick={onClose}>
        <article
          className="reader-card-in mx-auto mb-10 max-w-2xl overflow-hidden rounded-2xl border shadow-2xl"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <header
            className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-6 py-4 sm:px-8"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h2 className="font-display text-lg font-bold sm:text-xl">Meta</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              Cerrar
            </button>
          </header>

          <div className="flex flex-col gap-4 px-6 py-6 sm:px-8">
            <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
              ¿Qué querés lograr?
              <input
                className={fieldClass()}
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
              Estado
              <select
                className={fieldClass()}
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
              >
                {GOAL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {GOAL_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
              ¿Por qué me importa? (fase 1 — valores y motivación)
              <textarea
                className={fieldClass()}
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                rows={2}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
              Visualización (fase 2 — me veo, siento, escucho...)
              <textarea
                className={fieldClass()}
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                value={visualization}
                onChange={(e) => setVisualization(e.target.value)}
                rows={2}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
              Meta SMART (fase 3 — específica y medible)
              <textarea
                className={fieldClass()}
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                rows={2}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
              Fecha límite
              <input
                type="date"
                className={fieldClass()}
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
              Seguimiento (fase 5 — avances, obstáculos)
              <textarea
                className={fieldClass()}
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                rows={2}
              />
            </label>

            {status === "CUMPLIDA" && (
              <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
                ¿Cómo lo vas a celebrar? (fase 5 — el logro también se festeja)
                <textarea
                  className={fieldClass()}
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                  value={celebration}
                  onChange={(e) => setCelebration(e.target.value)}
                  rows={2}
                />
              </label>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateGoal.isPending}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
                style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
              >
                Guardar
              </button>
              {updateGoal.isError && <span className="text-xs text-red-500">No se pudo guardar.</span>}
            </div>

            <div className="mt-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-display mb-2 text-sm font-semibold">
                Pasos de acción {goal.steps.length > 0 && `(${doneSteps}/${goal.steps.length})`}
              </h3>
              <p className="mb-2 text-xs" style={{ color: "var(--text-2)" }}>
                Paso 3 de Brian Tracy: la lista de todo lo necesario, para accionar un poco cada día.
              </p>

              <ul className="flex flex-col gap-1.5">
                {goal.steps.map((step) => (
                  <li key={step.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={step.done}
                      onChange={(e) => toggleStep.mutate({ goalId: goal.id, stepId: step.id, done: e.target.checked })}
                      className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                    />
                    <span
                      className="min-w-0 flex-1 text-sm"
                      style={{
                        color: step.done ? "var(--text-2)" : "var(--text)",
                        textDecoration: step.done ? "line-through" : "none",
                      }}
                    >
                      {step.description}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteStep.mutate({ goalId: goal.id, stepId: step.id })}
                      aria-label="Borrar paso"
                      className="shrink-0 text-xs underline"
                      style={{ color: "var(--text-2)" }}
                    >
                      Borrar
                    </button>
                  </li>
                ))}
              </ul>

              <form onSubmit={handleAddStep} className="mt-2 flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-lg border p-2 text-sm"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                  placeholder="Agregar paso..."
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={createStep.isPending || !newStep.trim()}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  Agregar
                </button>
              </form>
            </div>

            <div className="mt-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              {!confirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="text-xs underline"
                  style={{ color: "#B91C1C" }}
                >
                  Eliminar meta
                </button>
              ) : (
                <div className="panel-expand-in rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm">¿Eliminar esta meta? Se borran también sus pasos.</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-2)" }}>
                    Esta acción no se puede deshacer.
                  </p>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded-lg border px-3 py-1.5 text-xs"
                      style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
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
