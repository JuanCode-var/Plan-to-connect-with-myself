import { useState } from "react";
import {
  HABIT_CATEGORIES,
  HABIT_CATEGORY_LABELS,
  HABIT_MOMENTS,
  HABIT_MOMENT_LABELS,
  type HabitCategory,
  type HabitMoment,
} from "../domain";
import { useCreateHabit } from "../api/habits";

export function HabitForm() {
  const [name, setName] = useState("");
  const [moment, setMoment] = useState<HabitMoment>("MANANA");
  const [category, setCategory] = useState<HabitCategory>("HABITO_BASE");
  const [specification, setSpecification] = useState("");
  const createHabit = useCreateHabit();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !specification.trim()) return;
    createHabit.mutate(
      { name: name.trim(), moment, category, specification: specification.trim() },
      {
        onSuccess: () => {
          setName("");
          setSpecification("");
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <h2 className="font-display font-semibold">Nuevo hábito</h2>

      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Nombre
        <input
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Momento del día
        <select
          className="rounded-lg border p-2"
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

      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Categoría
        <select
          className="rounded-lg border p-2"
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

      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Especificación
        <textarea
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          value={specification}
          onChange={(e) => setSpecification(e.target.value)}
          rows={2}
          required
        />
      </label>

      <button
        type="submit"
        disabled={createHabit.isPending}
        className="self-start rounded-lg px-3 py-1.5 text-sm font-semibold"
        style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
      >
        Crear hábito
      </button>
    </form>
  );
}
