import { useState } from "react";
import { useCreateGoal } from "../api/goals";

/**
 * Creación de una meta — fases 1 a 3 de la técnica (por qué importa,
 * visualización, meta SMART + fecha límite). Las fases 4 (pasos de acción,
 * ver GoalDetailModal) y 5 (seguimiento/celebración) no tienen sentido en la
 * creación: los pasos se arman después, en el detalle, y el seguimiento
 * recién existe una vez que la meta avanza.
 */
export function GoalForm({
  cycleId,
  defaultTargetDate,
  onCreated,
  onCancel,
}: {
  cycleId: string;
  defaultTargetDate: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [visualization, setVisualization] = useState("");
  const [specification, setSpecification] = useState("");
  const [targetDate, setTargetDate] = useState(defaultTargetDate);
  const createGoal = useCreateGoal();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !specification.trim() || !targetDate) return;
    createGoal.mutate(
      {
        cycleId,
        title: title.trim(),
        why: why.trim() || undefined,
        visualization: visualization.trim() || undefined,
        specification: specification.trim(),
        targetDate,
      },
      { onSuccess: onCreated },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-expand-in flex flex-col gap-3 rounded-xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <h2 className="font-display font-semibold">Nueva meta</h2>

      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        ¿Qué querés lograr? (sé específico — paso 1 de Brian Tracy: decidí exactamente qué y para cuándo)
        <input
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        ¿Por qué me importa? (conectá esto con un valor o una motivación real, no solo "porque sí")
        <textarea
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          rows={2}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Visualización: me veo, siento, escucho... (imaginá vívidamente el momento en que ya la lograste)
        <textarea
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          value={visualization}
          onChange={(e) => setVisualization(e.target.value)}
          rows={2}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Meta SMART (específica y medible: ¿cómo vas a saber que la cumpliste?)
        <textarea
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          value={specification}
          onChange={(e) => setSpecification(e.target.value)}
          rows={2}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Fecha límite (paso 2 de Brian Tracy: escribila con un plazo concreto)
        <input
          type="date"
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          required
        />
      </label>

      {createGoal.isError && <p className="text-sm text-red-500">No se pudo crear la meta.</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createGoal.isPending}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          Crear meta
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
