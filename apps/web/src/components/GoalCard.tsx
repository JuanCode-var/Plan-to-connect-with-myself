import { GOAL_STATUS_COLORS, GOAL_STATUS_LABELS } from "../domain";
import type { Goal } from "../api/goals";
import { todayISO } from "../lib/date";

function daysRemainingLabel(targetDateISO: string, today: string): string {
  const target = targetDateISO.slice(0, 10);
  const diffDays = Math.round(
    (new Date(`${target}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86_400_000,
  );
  if (diffDays < 0) return `vencida hace ${Math.abs(diffDays)} día${Math.abs(diffDays) === 1 ? "" : "s"}`;
  if (diffDays === 0) return "vence hoy";
  return `quedan ${diffDays} día${diffDays === 1 ? "" : "s"}`;
}

/**
 * Tarjeta compacta del tablero mosaico de /metas: lo justo para escanear el
 * estado de un vistazo (título, estado, fecha límite, progreso de pasos). El
 * resto de las 5 fases (por qué, visualización, seguimiento, celebración)
 * vive en GoalDetailModal — ponerlo todo acá haría la tarjeta tan larga como
 * el formulario, perdiendo el sentido de "tablero" que tiene esta vista.
 */
export function GoalCard({ goal, onOpen }: { goal: Goal; onOpen: () => void }) {
  const doneSteps = goal.steps.filter((s) => s.done).length;
  const totalSteps = goal.steps.length;
  const progress = totalSteps === 0 ? 0 : doneSteps / totalSteps;
  const color = GOAL_STATUS_COLORS[goal.status];
  const overdue = goal.status !== "CUMPLIDA" && goal.targetDate.slice(0, 10) < todayISO();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mosaic-card panel-card panel-card-in w-full rounded-2xl border p-4 pt-5 text-left"
      style={{ background: "var(--bg)", borderColor: "var(--border)", "--tile-accent": color } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display min-w-0 flex-1 font-semibold" style={{ color: "var(--text)" }}>
          {goal.title}
        </h3>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{ background: `${color}26`, color }}
        >
          {GOAL_STATUS_LABELS[goal.status]}
        </span>
      </div>

      <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
        {goal.specification}
      </p>

      {totalSteps > 0 && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${Math.round(progress * 100)}%`, background: color }}
            />
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--text-2)" }}>
            {doneSteps}/{totalSteps} pasos
          </p>
        </div>
      )}

      <p className="mt-2 text-xs font-medium" style={{ color: overdue ? "#DC2626" : "var(--text-2)" }}>
        {daysRemainingLabel(goal.targetDate, todayISO())}
      </p>
    </button>
  );
}
