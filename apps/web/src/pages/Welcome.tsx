import { useLocation, useNavigate } from "react-router-dom";
import { useCycleLogs, useCycles } from "../api/tracking";
import type { HabitLog } from "../api/tracking";
import type { LogStatus } from "../domain";
import { firstName, formatLongDateEs, timeOfDayGreeting, timeOfDayVariant } from "../lib/greeting";
import { calculatePerfectDayStreak } from "../lib/streak";
import { toDateOnlyISO } from "../lib/completion";
import { todayISO } from "../lib/date";
import { markWelcomeSeenToday } from "../lib/welcomeSeen";
import { useAuth } from "../lib/useAuth";
import { TimeOfDayIcon } from "../components/TimeOfDayIcon";
import { FlameIcon } from "../components/FlameIcon";

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

function buildLogLookup(logs: HabitLog[]): Map<string, LogStatus> {
  const map = new Map<string, LogStatus>();
  for (const log of logs) {
    map.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
  }
  return map;
}

/**
 * Pantalla de pantalla completa que se interpone antes de entrar a la app
 * (ver RequireAuth.tsx) la primera vez que la persona abre sesión cada día —
 * saludo grande, fecha de hoy y la racha de días perfectos del ciclo
 * activo, si hay uno. `markWelcomeSeenToday()` se llama al continuar, no al
 * montar, para no "gastar" la bienvenida del día si la pestaña se cierra
 * antes de que la persona llegue a tocar el botón.
 */
export function Welcome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: cycles } = useCycles();
  const activeCycle = cycles?.find((c) => c.isActive);
  const { data: cycleLogs } = useCycleLogs(activeCycle?.id);

  let perfectStreak = 0;
  if (cycleLogs) {
    const lookup = buildLogLookup(cycleLogs.logs);
    const effectiveStatus = (habitId: string, date: string): LogStatus =>
      lookup.get(`${habitId}|${date}`) ?? "PENDING";
    perfectStreak = calculatePerfectDayStreak(
      cycleLogs.habits,
      cycleLogs.days,
      effectiveStatus,
      todayISO(),
    );
  }

  function handleContinue() {
    markWelcomeSeenToday();
    const state = location.state as { from?: { pathname?: string } } | null;
    navigate(state?.from?.pathname ?? "/tracker", { replace: true });
  }

  if (!user) return null;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-10"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="welcome-card flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-8 text-center"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <span style={{ color: "var(--accent)" }}>
          <TimeOfDayIcon variant={timeOfDayVariant()} size={40} />
        </span>

        <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: "var(--text)" }}>
          {timeOfDayGreeting()}, <span style={{ color: "var(--accent)" }}>{firstName(user.name)}</span>
        </h1>

        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          {capitalize(formatLongDateEs())}
        </p>

        {perfectStreak >= 1 ? (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
            style={{ background: "rgba(217,119,6,0.18)", color: "#92400E" }}
          >
            <FlameIcon size={14} />
            Llevás {perfectStreak} {perfectStreak === 1 ? "día perfecto" : "días perfectos"} seguidos
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Hoy es un buen día para empezar de nuevo.
          </p>
        )}

        <button
          type="button"
          onClick={handleContinue}
          className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          Ir a mi seguimiento
        </button>
      </div>
    </div>
  );
}
