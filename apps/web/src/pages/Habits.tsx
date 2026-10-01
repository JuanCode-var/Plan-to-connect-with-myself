import { useState } from "react";
import { useHabits } from "../api/habits";
import { HABIT_MOMENTS, HABIT_MOMENT_LABELS, type HabitMoment } from "../domain";
import { HabitCard } from "../components/HabitCard";
import { HabitForm } from "../components/HabitForm";
import { SectionPager } from "../components/SectionPager";
import { SupplementWarnings } from "../components/SupplementWarnings";
import type { Habit } from "../api/habits";

function MomentPanel({ moment, habits }: { moment: HabitMoment; habits: Habit[] }) {
  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display font-semibold" style={{ color: "var(--text)" }}>
          {HABIT_MOMENT_LABELS[moment]}
        </h2>
        <span
          className="font-mono-num rounded-full px-2 py-0.5 text-xs"
          style={{ background: "var(--bg)", color: "var(--text-2)" }}
        >
          {habits.length}
        </span>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Sin hábitos en este momento.
        </p>
      ) : (
        <ul className="mosaic-wall columns-1 sm:columns-2 lg:columns-3">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Antes: 4 columnas lado a lado (una por momento del día). Ahora: una sola
 * sección a todo el ancho con pestañas + flechas para pasar a la siguiente
 * (ver SectionPager.tsx) — mismo objetivo de siempre (aprovechar el ancho,
 * no scrollear de más), pero cada momento se ve grande en vez de apretado en
 * 1/4 de la pantalla.
 */
export function Habits() {
  const { data: habits, isLoading, isError } = useHabits();
  const [showForm, setShowForm] = useState(false);
  const [moment, setMoment] = useState<HabitMoment>(HABIT_MOMENTS[0]);

  return (
    <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ color: "var(--text)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Catálogo de hábitos</h1>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            {showForm ? "Cerrar" : "+ Nuevo hábito"}
          </button>
        </div>

        <SupplementWarnings />

        {showForm && <HabitForm onCreated={() => setShowForm(false)} />}

        {isLoading && <p style={{ color: "var(--text-2)" }}>Cargando hábitos…</p>}
        {isError && <p className="text-red-500">No se pudieron cargar los hábitos.</p>}

        {habits && (
          <SectionPager
            sections={HABIT_MOMENTS}
            labels={HABIT_MOMENT_LABELS}
            active={moment}
            onChange={setMoment}
            panels={Object.fromEntries(
              HABIT_MOMENTS.map((m) => [
                m,
                <MomentPanel
                  key={m}
                  moment={m}
                  habits={habits.filter((h) => h.moment === m).sort((a, b) => a.sortOrder - b.sortOrder)}
                />,
              ]),
            ) as Record<HabitMoment, React.ReactNode>}
          />
        )}
      </div>
    </div>
  );
}
