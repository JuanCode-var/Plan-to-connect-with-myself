import { useState } from "react";
import { useCycles } from "../api/tracking";
import { useGoals } from "../api/goals";
import { CycleSelector } from "../components/CycleSelector";
import { GoalForm } from "../components/GoalForm";
import { GoalCard } from "../components/GoalCard";
import { GoalDetailModal } from "../components/GoalDetailModal";

/**
 * Metas del ciclo seleccionado (por defecto, el activo) — técnica de
 * visualización y establecimiento de metas (5 fases) fusionada con los 3
 * pasos de Brian Tracy. Mismo patrón de tablero mosaico que Hábitos/Diario/
 * Biblioteca, y mismo selector de
 * ciclo que /tracker y /dashboard — las metas viven dentro de un ciclo, no
 * de un mes calendario, así que tiene sentido poder mirar las de un ciclo
 * pasado del mismo modo que se mira su matriz de hábitos.
 */
export function Metas() {
  const { data: cycles, isLoading: cyclesLoading, isError: cyclesError } = useCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [openGoalId, setOpenGoalId] = useState<string | undefined>(undefined);

  const selectedCycleStillExists = !!selectedCycleId && !!cycles?.some((c) => c.id === selectedCycleId);
  const defaultCycleId =
    cycles && cycles.length > 0 ? (cycles.find((c) => c.isActive) ?? cycles[cycles.length - 1]).id : undefined;
  const effectiveCycleId = selectedCycleStillExists ? selectedCycleId : defaultCycleId;
  const effectiveCycle = cycles?.find((c) => c.id === effectiveCycleId);

  const { data: goals, isLoading: goalsLoading, isError: goalsError } = useGoals(effectiveCycleId);
  const openGoal = goals?.find((g) => g.id === openGoalId);

  return (
    <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ color: "var(--text)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Metas del ciclo</h1>
          <div className="flex flex-wrap items-center gap-2">
            {cycles && cycles.length > 0 && (
              <CycleSelector cycles={cycles} selectedCycleId={effectiveCycleId} onChange={setSelectedCycleId} />
            )}
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              disabled={!effectiveCycleId}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              {showForm ? "Cerrar" : "+ Nueva meta"}
            </button>
          </div>
        </div>

        {cyclesLoading && <p style={{ color: "var(--text-2)" }}>Cargando ciclos…</p>}
        {cyclesError && <p className="text-red-500">No se pudieron cargar los ciclos.</p>}
        {!cyclesLoading && cycles && cycles.length === 0 && (
          <p style={{ color: "var(--text-2)" }}>Todavía no hay ciclos — creá uno en Seguimiento primero.</p>
        )}

        {showForm && effectiveCycleId && effectiveCycle && (
          <GoalForm
            cycleId={effectiveCycleId}
            defaultTargetDate={effectiveCycle.endDate.slice(0, 10)}
            onCreated={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        )}

        {effectiveCycleId && goalsLoading && <p style={{ color: "var(--text-2)" }}>Cargando metas…</p>}
        {goalsError && <p className="text-red-500">No se pudieron cargar las metas.</p>}
        {goals && goals.length === 0 && (
          <p style={{ color: "var(--text-2)" }}>Todavía no hay metas en este ciclo. Creá la primera.</p>
        )}

        {goals && goals.length > 0 && (
          <ul className="mosaic-wall columns-1 sm:columns-2 lg:columns-3">
            {goals.map((goal) => (
              <li key={goal.id}>
                <GoalCard goal={goal} onOpen={() => setOpenGoalId(goal.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {openGoal && effectiveCycleId && (
        <GoalDetailModal goal={openGoal} cycleId={effectiveCycleId} onClose={() => setOpenGoalId(undefined)} />
      )}
    </div>
  );
}
