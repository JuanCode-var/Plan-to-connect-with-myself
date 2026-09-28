import { useHabits } from "../api/habits";
import { HABIT_MOMENTS, HABIT_MOMENT_LABELS, type HabitMoment } from "../domain";
import { HabitCard } from "../components/HabitCard";
import { HabitForm } from "../components/HabitForm";
import { SupplementWarnings } from "../components/SupplementWarnings";

export function Habits() {
  const { data: habits, isLoading, isError } = useHabits();

  return (
    <div
      className="min-h-full px-4 py-6 sm:px-8 sm:py-8"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Catálogo de hábitos</h1>

        <SupplementWarnings />

        {isLoading && <p style={{ color: "var(--text-2)" }}>Cargando hábitos…</p>}
        {isError && <p className="text-red-500">No se pudieron cargar los hábitos.</p>}

        {habits &&
          HABIT_MOMENTS.map((moment: HabitMoment) => {
            const habitsForMoment = habits
              .filter((h) => h.moment === moment)
              .sort((a, b) => a.sortOrder - b.sortOrder);

            if (habitsForMoment.length === 0) return null;

            return (
              <section key={moment} className="flex flex-col gap-2">
                <h2 className="font-display font-semibold" style={{ color: "var(--text-2)" }}>
                  {HABIT_MOMENT_LABELS[moment]}
                </h2>
                <ul className="flex flex-col gap-2">
                  {habitsForMoment.map((habit) => (
                    <HabitCard key={habit.id} habit={habit} />
                  ))}
                </ul>
              </section>
            );
          })}

        <HabitForm />
      </div>
    </div>
  );
}
