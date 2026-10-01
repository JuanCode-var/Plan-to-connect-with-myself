import type { CycleLogs } from "../api/tracking";
import { HABIT_PRIORITY_COLORS, type HabitCategory } from "../domain";
import { isDateCountableForHabit, toDateOnlyISO } from "../lib/completion";
import { todayISO } from "../lib/date";
import { firstName } from "../lib/greeting";
import { calculatePerfectDayStreak } from "../lib/streak";
import { useAuth } from "../lib/useAuth";
import { FitnessRings, type FitnessRingData } from "./FitnessRings";
import { FlameIcon } from "./FlameIcon";

// Los 3 anillos muestran el progreso de HOY de cada NIVEL de prioridad, uno
// a uno (ver HABIT_CATEGORY_PRIORITY en domain.ts) — no de categorías
// sueltas: el externo es prioridad alta (PRIORIDAD_MAXIMA, lo primero que
// hay que resolver en el día), el del medio es prioridad media (hábitos
// base + condicionales + autoconocimiento), el interno es prioridad baja
// (suplementos opcionales). Los colores son EXACTAMENTE HABIT_PRIORITY_COLORS
// (no se inventan acá), los mismos que usa PriorityIcon en el resto de la app.
const RING_GROUPS: Array<{ label: string; categories: HabitCategory[]; color: string }> = [
  { label: "Prioridad alta", categories: ["PRIORIDAD_MAXIMA"], color: HABIT_PRIORITY_COLORS.ALTA },
  {
    label: "Prioridad media",
    categories: ["HABITO_BASE", "CONDICIONAL", "AUTOCONOCIMIENTO"],
    color: HABIT_PRIORITY_COLORS.MEDIA,
  },
  {
    label: "Prioridad baja",
    categories: ["SUPLEMENTO", "OPCIONAL"],
    color: HABIT_PRIORITY_COLORS.BAJA,
  },
];

function motivationalLine(done: number, total: number, name: string | undefined): string {
  if (total === 0) return "Sin hábitos contables todavía hoy.";
  if (done === 0) return "Arrancá con uno — el primero siempre cuesta más que el resto.";
  if (done === total) {
    return name ? `¡Día completo, ${name}! Cerraste todos tus hábitos de hoy.` : "Día completo. Cerraste todos tus hábitos de hoy.";
  }
  const remaining = total - done;
  return remaining === 1
    ? "Te falta uno solo para cerrar el día."
    : `Vas bien — quedan ${remaining} para cerrar el día.`;
}

/**
 * Progreso del día de hoy dentro del ciclo mostrado, como 3 anillos
 * concéntricos (estilo Apple Fitness) + la racha de "días perfectos" (todos
 * los hábitos contables del día en `DONE`, consecutivos hasta hoy). Solo
 * cuenta hábitos contables hoy (mismo criterio que el resto de la app,
 * `isDateCountableForHabit`) y usa `date === hoy` exacto, no un rango.
 */
export function TodayProgress({ data }: { data: CycleLogs }) {
  const { user } = useAuth();
  const today = todayISO();
  const inRange = data.days.includes(today);
  if (!inRange) return null;

  const lookup = new Map<string, string>();
  for (const log of data.logs) {
    lookup.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
  }
  const effectiveStatus = (habitId: string, date: string) =>
    (lookup.get(`${habitId}|${date}`) ?? "PENDING") as "DONE" | "PENDING" | "NA";

  const countableHabits = data.habits.filter((h) => isDateCountableForHabit(h.createdAt, today));
  const done = countableHabits.filter((h) => effectiveStatus(h.id, today) === "DONE").length;
  const total = countableHabits.length;

  const groupStats = RING_GROUPS.map((group) => {
    const habitsInGroup = countableHabits.filter((h) =>
      group.categories.includes(h.category as HabitCategory),
    );
    const doneInGroup = habitsInGroup.filter((h) => effectiveStatus(h.id, today) === "DONE").length;
    const totalInGroup = habitsInGroup.length;
    return { ...group, done: doneInGroup, total: totalInGroup };
  });

  const rings: FitnessRingData[] = groupStats.map((g) => ({
    pct: g.total === 0 ? 0 : g.done / g.total,
    color: g.color,
  }));

  const perfectStreak = calculatePerfectDayStreak(data.habits, data.days, effectiveStatus, today);

  return (
    <div
      className="flex flex-wrap items-center gap-6 rounded-xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <FitnessRings rings={rings} />

      <div className="flex min-w-[220px] flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs tracking-wide uppercase" style={{ color: "var(--text-2)" }}>
            Progreso de hoy · {done}/{total}
          </span>
          {perfectStreak >= 2 && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: "rgba(217,119,6,0.18)", color: "#92400E" }}
              title={`${perfectStreak} días perfectos seguidos`}
            >
              <FlameIcon size={12} />
              {perfectStreak}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {groupStats.map((g) => (
            <div key={g.label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-2)" }}>
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: g.color }} />
              {g.label} <span className="font-mono-num">{g.done}/{g.total}</span>
            </div>
          ))}
        </div>

        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          {motivationalLine(done, total, user ? firstName(user.name) : undefined)}
        </p>
      </div>
    </div>
  );
}
