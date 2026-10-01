import { useState } from "react";
import type { Habit } from "../api/habits";
import { useUpdateHabit } from "../api/habits";
import { CategoryBadge } from "./CategoryBadge";
import { HABIT_CATEGORY_PRIORITY, HABIT_PRIORITY_COLORS } from "../domain";

export function HabitCard({ habit }: { habit: Habit }) {
  const [editing, setEditing] = useState(false);
  const [specification, setSpecification] = useState(habit.specification);
  const updateHabit = useUpdateHabit();

  function handleSave() {
    updateHabit.mutate(
      { id: habit.id, data: { specification } },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handlePause() {
    updateHabit.mutate({ id: habit.id, data: { active: false } });
  }

  const accent = HABIT_PRIORITY_COLORS[HABIT_CATEGORY_PRIORITY[habit.category]];

  return (
    <li
      // Fondo --bg (no --surface, igual que la columna que la contiene en
      // Habits.tsx) a propósito: así cada tarjeta se ve como un bloque propio
      // con contraste real, no solo separado por un borde de 1px sobre el
      // mismo tono de fondo — eso era lo que las hacía sentir "pegadas". La
      // franja de color arriba (mosaic-card) usa el mismo color que el ícono
      // de prioridad en CategoryBadge, así la tarjeta entera "avisa" su
      // urgencia de un vistazo, no solo el badge.
      className="mosaic-card panel-card rounded-xl border p-3.5 pt-4"
      style={
        {
          background: "var(--bg)",
          borderColor: "var(--border)",
          color: "var(--text)",
          "--tile-accent": accent,
        } as React.CSSProperties
      }
    >
      {/* min-w-0 en el nombre + shrink-0 en el badge: sin esto, el badge
          (whitespace-nowrap) no cede espacio y en columnas angostas empuja
          al nombre a desbordar la tarjeta en vez de pasar a una 2da línea
          (le pasaba a "Autoconocimiento" en la columna de Cierre del día). */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="min-w-0 flex-1 font-medium">{habit.name}</span>
        <div className="shrink-0">
          <CategoryBadge category={habit.category} />
        </div>
      </div>

      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            className="rounded border p-2 text-sm"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
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
              className="rounded border px-2 py-1 text-xs"
              style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>
          {habit.specification}
        </p>
      )}

      {!editing && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs underline"
            style={{ color: "var(--text-2)" }}
          >
            Editar especificación
          </button>
          <button
            type="button"
            onClick={handlePause}
            disabled={updateHabit.isPending}
            className="text-xs underline"
            style={{ color: "var(--text-2)" }}
          >
            Pausar
          </button>
        </div>
      )}
    </li>
  );
}
