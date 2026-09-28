import { useState } from "react";
import { HABIT_CATEGORY_COLORS, type HabitCategory } from "../domain";
import type { Habit } from "../api/habits";
import { useUpdateHabit } from "../api/habits";
import { CategoryBadge } from "./CategoryBadge";

export function HabitCard({ habit }: { habit: Habit }) {
  const [editing, setEditing] = useState(false);
  const [specification, setSpecification] = useState(habit.specification);
  const updateHabit = useUpdateHabit();
  const tint = HABIT_CATEGORY_COLORS[habit.category as HabitCategory].rowTint;

  function handleSave() {
    updateHabit.mutate(
      { id: habit.id, data: { specification } },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handlePause() {
    updateHabit.mutate({ id: habit.id, data: { active: false } });
  }

  // El tinte de categoría es siempre un color claro (ver
  // HABIT_CATEGORY_COLORS), sin importar el tema de la app — por eso el
  // texto de la tarjeta usa colores oscuros fijos en vez de heredar
  // var(--text) (que en modo oscuro quedaría ilegible sobre el tinte).
  const tintText = "#20242B";
  const tintTextMuted = "rgba(32,36,43,0.7)";

  return (
    <li
      className="rounded-md border border-black/10 p-3"
      style={{ backgroundColor: tint, color: tintText }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium">{habit.name}</span>
        <CategoryBadge category={habit.category} />
      </div>

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            className="rounded border border-black/20 bg-white/70 p-2 text-sm"
            style={{ color: tintText }}
            value={specification}
            onChange={(e) => setSpecification(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateHabit.isPending}
              className="rounded px-2 py-1 text-xs font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setSpecification(habit.specification);
                setEditing(false);
              }}
              className="rounded border border-black/20 px-2 py-1 text-xs"
              style={{ color: tintText }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm whitespace-pre-wrap" style={{ color: tintTextMuted }}>
          {habit.specification}
        </p>
      )}

      {!editing && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs underline"
            style={{ color: tintText }}
          >
            Editar especificación
          </button>
          <button
            type="button"
            onClick={handlePause}
            disabled={updateHabit.isPending}
            className="text-xs underline"
            style={{ color: tintText }}
          >
            Pausar
          </button>
        </div>
      )}
    </li>
  );
}
