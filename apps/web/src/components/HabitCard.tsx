import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Habit } from "../api/habits";
import { useDeleteHabit, useUpdateHabit } from "../api/habits";
import { CategoryBadge } from "./CategoryBadge";
import {
  HABIT_CATEGORIES,
  HABIT_CATEGORY_LABELS,
  HABIT_MOMENTS,
  HABIT_MOMENT_LABELS,
  HABIT_PRIORITY_COLORS,
  HABIT_PRIORITY_LEVELS,
  HABIT_PRIORITY_LABELS,
  type HabitCategory,
  type HabitMoment,
  type HabitPriorityLevel,
} from "../domain";

function DragHandleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <circle cx="6" cy="5" r="1.6" />
      <circle cx="14" cy="5" r="1.6" />
      <circle cx="6" cy="10" r="1.6" />
      <circle cx="14" cy="10" r="1.6" />
      <circle cx="6" cy="15" r="1.6" />
      <circle cx="14" cy="15" r="1.6" />
    </svg>
  );
}

/**
 * Sin window.confirm (prohibido por convención del proyecto, ver
 * DeleteCycleButton.tsx): confirmación propia. Borrar el hábito borra
 * también sus HabitLog (ver DELETE /habits/:id) — irreversible, por eso el
 * paso extra, distinto de "Pausar" (que conserva el historial).
 *
 * A diferencia de DeleteCycleButton (que vive fuera de cualquier tarjeta),
 * este panel de confirmación se renderiza en flujo normal, no como overlay
 * `absolute`: `.mosaic-card` tiene `overflow: hidden` (para recortar la
 * franja de color de arriba) y un overlay absoluto quedaría cortado. Ocupar
 * una fila propia que empuja la tarjeta más alta es la forma segura de
 * mostrarlo dentro de ese contenedor.
 */
function DeleteConfirmPanel({
  habitId,
  habitName,
  onCancel,
}: {
  habitId: string;
  habitName: string;
  onCancel: () => void;
}) {
  const deleteHabit = useDeleteHabit();

  return (
    <div className="panel-expand-in mt-2 rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <p className="text-sm" style={{ color: "var(--text)" }}>
        ¿Eliminar <strong>{habitName}</strong>? Se borra también su historial.
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--text-2)" }}>
        Esta acción no se puede deshacer.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={deleteHabit.isPending}
          onClick={() => deleteHabit.mutate(habitId, { onSuccess: onCancel })}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: "#B91C1C" }}
        >
          {deleteHabit.isPending ? "Eliminando…" : "Eliminar"}
        </button>
      </div>
    </div>
  );
}

export function HabitCard({ habit, delay = 0 }: { habit: Habit; delay?: number }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [name, setName] = useState(habit.name);
  const [category, setCategory] = useState<HabitCategory>(habit.category);
  const [priority, setPriority] = useState<HabitPriorityLevel>(habit.priority);
  const [moment, setMoment] = useState<HabitMoment>(habit.moment);
  const [specification, setSpecification] = useState(habit.specification);
  const updateHabit = useUpdateHabit();

  function handleSave() {
    if (!name.trim()) return;
    updateHabit.mutate(
      { id: habit.id, data: { name: name.trim(), category, priority, moment, specification } },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handlePause() {
    updateHabit.mutate({ id: habit.id, data: { active: false } });
  }

  const accent = HABIT_PRIORITY_COLORS[habit.priority];

  // Handle dedicado (en vez de toda la tarjeta draggable): la tarjeta tiene
  // varios botones propios (Editar/Pausar/Eliminar) que necesitan su click
  // normal — si {...listeners} fuera al <li>, dnd-kit se los comería.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id });

  return (
    <li
      ref={setNodeRef}
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
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
          zIndex: isDragging ? 10 : undefined,
        } as React.CSSProperties
      }
    >
      {/* Wrapper propio para la animación de entrada (en vez de ponerla
          directo en el <li>): el <li> ya tiene su `transform` tomado por
          dnd-kit durante el drag, y una animación CSS con fill-mode "both"
          sobre esa misma propiedad lo pisaría apenas termina de reproducirse
          (quedaría clavado en translateY(0), sin moverse al arrastrar). */}
      <div className="panel-card-in" style={{ animationDelay: `${delay}ms` }}>
      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            className="rounded border p-2 text-sm font-medium"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-2)" }}>
            Categoría
            <select
              className="rounded border p-2 text-sm"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              value={category}
              onChange={(e) => setCategory(e.target.value as HabitCategory)}
            >
              {HABIT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {HABIT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-2)" }}>
            Prioridad
            <select
              className="rounded border p-2 text-sm"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              value={priority}
              onChange={(e) => setPriority(e.target.value as HabitPriorityLevel)}
            >
              {HABIT_PRIORITY_LEVELS.map((p) => (
                <option key={p} value={p}>
                  {HABIT_PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--text-2)" }}>
            Momento del día
            <select
              className="rounded border p-2 text-sm"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              value={moment}
              onChange={(e) => setMoment(e.target.value as HabitMoment)}
            >
              {HABIT_MOMENTS.map((m) => (
                <option key={m} value={m}>
                  {HABIT_MOMENT_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
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
              disabled={updateHabit.isPending || !name.trim()}
              className="rounded px-2 py-1 text-xs font-semibold disabled:opacity-60"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setName(habit.name);
                setCategory(habit.category);
                setPriority(habit.priority);
                setMoment(habit.moment);
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
        <>
          {/* min-w-0 en el nombre + shrink-0 en el badge: sin esto, el badge
              (whitespace-nowrap) no cede espacio y en columnas angostas empuja
              al nombre a desbordar la tarjeta en vez de pasar a una 2da línea
              (le pasaba a "Autoconocimiento" en la columna de Cierre del día). */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-1.5">
              <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Arrastrar para reordenar"
                title="Arrastrar para reordenar"
                className="mt-0.5 shrink-0 cursor-grab touch-none rounded px-0.5 py-0.5 active:cursor-grabbing"
                style={{ color: "var(--text-2)" }}
              >
                <DragHandleIcon />
              </button>
              <span className="min-w-0 flex-1 font-medium">{habit.name}</span>
            </div>
            <div className="shrink-0">
              <CategoryBadge category={habit.category} priority={habit.priority} />
            </div>
          </div>

          <p className="mt-1 text-sm whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>
            {habit.specification}
          </p>

          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs underline"
              style={{ color: "var(--text-2)" }}
            >
              Editar
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
            <button
              type="button"
              onClick={() => setConfirmingDelete((v) => !v)}
              className="text-xs underline"
              style={{ color: "#B91C1C" }}
            >
              Eliminar
            </button>
          </div>

          {confirmingDelete && (
            <DeleteConfirmPanel
              habitId={habit.id}
              habitName={habit.name}
              onCancel={() => setConfirmingDelete(false)}
            />
          )}
        </>
      )}
      </div>
    </li>
  );
}
