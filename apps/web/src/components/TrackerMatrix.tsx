import { Fragment, useEffect, useRef, useState } from "react";
import {
  HABIT_MOMENTS,
  HABIT_MOMENT_LABELS,
  HABIT_PRIORITY_COLORS,
  type HabitMoment,
  type LogStatus,
} from "../domain";
import { PriorityIcon } from "./PriorityIcon";
import { randomLibraryEntry, useLibrary } from "../api/library";
import { useSetLogStatus } from "../api/tracking";
import type { CycleLogs, HabitLog } from "../api/tracking";
import {
  calculateCompletionRate,
  isDateCountableForHabit,
  isDateLockedForHabit,
  toDateOnlyISO,
} from "../lib/completion";
import { calculateCurrentStreak } from "../lib/streak";
import { todayISO } from "../lib/date";
import { showToast } from "../lib/toast";
import { firstName } from "../lib/greeting";
import { useAuth } from "../lib/useAuth";
import { FlameIcon } from "./FlameIcon";

type NaMenuState = { habitId: string; date: string; x: number; y: number } | null;

function formatDayHeader(dateISO: string): string {
  const [, month, day] = dateISO.split("-");
  return `${day}/${month}`;
}

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function buildLogLookup(logs: HabitLog[]): Map<string, LogStatus> {
  const map = new Map<string, LogStatus>();
  for (const log of logs) {
    map.set(`${log.habitId}|${toDateOnlyISO(log.date)}`, log.status);
  }
  return map;
}

export function TrackerMatrix({ cycleId, data }: { cycleId: string; data: CycleLogs }) {
  const { days, habits, logs } = data;
  const setLogStatus = useSetLogStatus(cycleId);
  const [naMenu, setNaMenu] = useState<NaMenuState>(null);
  const { user } = useAuth();
  const today = todayISO();
  const { data: quotes } = useLibrary("FRASE");

  // Navegación entre días de la tabla (ver DAY_STEP_PX más abajo): antes solo
  // existía el scroll horizontal nativo, delgado y poco visible, para llegar
  // a la columna de "Hoy" en ciclos largos. Los botones ◀ Hoy ▶ dan una
  // alternativa grande y explícita para moverse; el scrollbar nativo (ahora
  // también más grueso y con el color de marca, ver .tracker-scroll en
  // index.css) sigue funcionando para quien prefiera arrastrar directo.
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const todayHeaderRef = useRef<HTMLTableCellElement | null>(null);

  useEffect(() => {
    todayHeaderRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [cycleId]);

  const DAY_STEP_PX = 7 * 46; // una semana de columnas (44px + bordes)

  function scrollByDays(direction: 1 | -1) {
    scrollContainerRef.current?.scrollBy({ left: direction * DAY_STEP_PX, behavior: "smooth" });
  }

  function scrollToToday() {
    todayHeaderRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  const lookup = buildLogLookup(logs);

  function effectiveStatus(habitId: string, date: string): LogStatus {
    return lookup.get(`${habitId}|${date}`) ?? "PENDING";
  }

  function handleToggle(habitId: string, date: string) {
    const current = effectiveStatus(habitId, date);
    const next: LogStatus = current === "DONE" ? "PENDING" : "DONE";
    setLogStatus.mutate({ habitId, date, status: next });

    // Frase motivacional (Biblioteca, sección FRASE) en cada hábito logrado
    // — no solo al cerrar el día. Al azar, independiente del toast de "día
    // completo" de abajo: ambos pueden apilarse (ToastHost soporta varios a
    // la vez) sin pisarse.
    if (next === "DONE") {
      const quote = randomLibraryEntry(quotes);
      if (quote) {
        showToast(`${quote.content}${quote.author ? ` — ${quote.author}` : ""}`, "quote");
      }
    }

    // Refuerzo positivo inmediato: si esta marca cierra TODOS los hábitos
    // contables de hoy, un toast celebra el cierre del día. Se calcula acá
    // (no en el servidor) porque solo importa para la fecha de hoy en la
    // sesión actual del usuario, no es un dato que haya que persistir.
    if (next === "DONE" && date === today) {
      const dayComplete = habits.every((h) => {
        if (!isDateCountableForHabit(h.createdAt, date)) return true;
        if (h.id === habitId) return true;
        return effectiveStatus(h.id, date) === "DONE";
      });
      if (dayComplete) {
        showToast(
          user
            ? `¡Bien ahí, ${firstName(user.name)}! Cerraste todos tus hábitos de hoy.`
            : "Día completo. Cerraste todos tus hábitos de hoy.",
        );
      }
    }
  }

  function handleSetNA(habitId: string, date: string) {
    setLogStatus.mutate({ habitId, date, status: "NA" });
    setNaMenu(null);
  }

  // % por hábito (fila) y por día (columna), recalculados en cada render a
  // partir de los datos ya cacheados (sin esperar refetch del servidor).
  const habitRates = new Map<string, number>();
  for (const habit of habits) {
    const statuses: LogStatus[] = [];
    for (const date of days) {
      if (!isDateCountableForHabit(habit.createdAt, date)) continue;
      statuses.push(effectiveStatus(habit.id, date));
    }
    habitRates.set(habit.id, calculateCompletionRate(statuses));
  }

  const dayRates = new Map<string, number>();
  for (const date of days) {
    const statuses: LogStatus[] = [];
    for (const habit of habits) {
      if (!isDateCountableForHabit(habit.createdAt, date)) continue;
      statuses.push(effectiveStatus(habit.id, date));
    }
    dayRates.set(date, calculateCompletionRate(statuses));
  }

  return (
    // `key={cycleId}` fuerza un remount (y por lo tanto la animación de
    // entrada) cada vez que se cambia de ciclo con CycleSelector — sin esto,
    // React reconciliaría el mismo <div> y la tabla cambiaría de contenido
    // de golpe en vez de sentirse como una vista nueva.
    <div key={cycleId} className="panel-card-in relative">
      <div className="mb-2 flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => scrollByDays(-1)}
          aria-label="Ver días anteriores"
          title="Días anteriores"
          className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-transform hover:scale-105 active:scale-95"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={scrollToToday}
          className="rounded-full px-3 py-1.5 text-xs font-semibold transition-transform hover:scale-105 active:scale-95"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => scrollByDays(1)}
          aria-label="Ver días siguientes"
          title="Días siguientes"
          className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-transform hover:scale-105 active:scale-95"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          ›
        </button>
      </div>
      <div
        ref={scrollContainerRef}
        className="tracker-scroll overflow-x-auto rounded-xl border"
        style={{ borderColor: "var(--border)" }}
      >
        <table className="w-max border-collapse text-sm">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-20 min-w-[180px] border-b p-2 text-left"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                Hábito
              </th>
              {days.map((date) => {
                const isToday = date === today;
                const isClosed = date < today;
                return (
                  <th
                    key={date}
                    ref={isToday ? todayHeaderRef : undefined}
                    className="min-w-[44px] border-b p-1 text-center text-xs font-normal"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      color: isToday ? "var(--text)" : "var(--text-2)",
                      // "Hoy" se marca con un anillo neutro (var(--text)), no
                      // con --accent: ese color ya se usa para el estado de
                      // ánimo general de la app (CTA, "Hoy" del saludo), no
                      // hace falta reutilizarlo también acá.
                      boxShadow: isToday ? "inset 0 0 0 2px var(--text)" : undefined,
                    }}
                  >
                    <div
                      className="font-mono-num flex items-center justify-center gap-0.5 font-semibold"
                      style={{ color: "var(--text)" }}
                      title={isClosed ? "Día cerrado: ya no se puede modificar" : undefined}
                    >
                      {isToday ? "Hoy" : formatDayHeader(date)}
                      {isClosed && (
                        <span className="text-[10px] opacity-60" aria-hidden>
                          🔒
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              <th
                className="sticky right-0 z-20 min-w-[56px] border-b p-2 text-center text-xs"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {HABIT_MOMENTS.map((moment: HabitMoment) => {
              const habitsForMoment = habits.filter((h) => h.moment === moment);
              if (habitsForMoment.length === 0) return null;

              return (
                <Fragment key={moment}>
                  <tr>
                    <td
                      colSpan={days.length + 2}
                      className="sticky left-0 px-2 py-1 text-xs font-semibold tracking-wide uppercase"
                      style={{ background: "var(--border)", color: "var(--text-2)" }}
                    >
                      {HABIT_MOMENT_LABELS[moment]}
                    </td>
                  </tr>
                  {habitsForMoment.map((habit) => {
                    // El fondo de fila es siempre neutro: el color fuerte se
                    // reserva para el estado cumplido/pendiente de cada
                    // celda, no para la prioridad del hábito (esa se lee con
                    // el ícono de PriorityIcon, no con hue).
                    const priorityLevel = habit.priority;
                    const streak = calculateCurrentStreak(habit, days, effectiveStatus, today);
                    return (
                      <tr key={habit.id}>
                        <td
                          className="sticky left-0 z-10 min-w-[180px] border-b p-2 font-medium"
                          style={{
                            background: "var(--surface)",
                            borderColor: "var(--border)",
                            color: "var(--text)",
                          }}
                          title={habit.specification}
                        >
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: HABIT_PRIORITY_COLORS[priorityLevel] }} aria-hidden>
                              <PriorityIcon level={priorityLevel} />
                            </span>
                            <span>{habit.name}</span>
                            {/* Racha visible desde 2 días: por debajo de eso
                                todavía no es una racha real y solo agrega
                                ruido visual a la fila. */}
                            {streak >= 2 && (
                              <span
                                className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                                style={{ background: "rgba(217,119,6,0.18)", color: "#92400E" }}
                                title={`Racha de ${streak} días seguidos`}
                              >
                                <FlameIcon />
                                {streak}
                              </span>
                            )}
                          </div>
                        </td>
                        {days.map((date) => {
                          const countable = isDateCountableForHabit(habit.createdAt, date);
                          const isToday = date === today;
                          const isClosed = isDateLockedForHabit(moment, date, today);
                          return (
                            <td
                              key={date}
                              className="border-b p-1 text-center"
                              style={{
                                background: "var(--surface)",
                                borderColor: "var(--border)",
                                boxShadow: isToday ? "inset 0 0 0 2px var(--text)" : undefined,
                              }}
                            >
                              {countable ? (
                                <StatusCell
                                  status={effectiveStatus(habit.id, date)}
                                  locked={isClosed}
                                  onToggle={() => handleToggle(habit.id, date)}
                                  onOpenNaMenu={(x, y) =>
                                    setNaMenu({ habitId: habit.id, date, x, y })
                                  }
                                />
                              ) : (
                                <span style={{ color: "var(--text-2)", opacity: 0.4 }} aria-hidden>
                                  ·
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td
                          className="font-mono-num sticky right-0 z-10 border-b p-2 text-center text-xs font-semibold"
                          style={{
                            background: "var(--surface)",
                            borderColor: "var(--border)",
                            color: "var(--text)",
                          }}
                        >
                          {formatPercent(habitRates.get(habit.id) ?? 0)}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td
                className="sticky left-0 z-10 border-t p-2 text-xs font-semibold"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                % cumplimiento
              </td>
              {days.map((date) => (
                <td
                  key={date}
                  className="font-mono-num border-t p-1 text-center text-xs font-semibold"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                    boxShadow: date === today ? "inset 0 0 0 2px var(--text)" : undefined,
                  }}
                >
                  {formatPercent(dayRates.get(date) ?? 0)}
                </td>
              ))}
              <td
                className="sticky right-0 z-10 border-t p-2"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              />
            </tr>
          </tfoot>
        </table>
      </div>

      {naMenu && (
        <NaMenu
          x={naMenu.x}
          y={naMenu.y}
          onSelect={() => handleSetNA(naMenu.habitId, naMenu.date)}
          onDismiss={() => setNaMenu(null)}
        />
      )}
    </div>
  );
}

function StatusCell({
  status,
  locked,
  onToggle,
  onOpenNaMenu,
}: {
  status: LogStatus;
  locked: boolean;
  onToggle: () => void;
  onOpenNaMenu: (x: number, y: number) => void;
}) {
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const previousStatus = useRef(status);
  const [celebrating, setCelebrating] = useState(false);

  // Refuerzo positivo inmediato al pasar a DONE (clic propio o revertido por
  // el servidor tras una respuesta): un "pop" del círculo + un halo que se
  // expande y desvanece (clases `cell-pop`/`cell-burst`, definidas en
  // index.css con soporte para `prefers-reduced-motion`). Se dispara en un
  // efecto atado al valor de `status`, no al evento de clic, para que
  // también se vea si el estado cambia por otra vía (ej. otra pestaña).
  useEffect(() => {
    if (previousStatus.current !== "DONE" && status === "DONE") {
      setCelebrating(true);
      const timeout = window.setTimeout(() => setCelebrating(false), 600);
      previousStatus.current = status;
      return () => window.clearTimeout(timeout);
    }
    previousStatus.current = status;
  }, [status]);

  function clearLongPressTimer() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTouchStart(e: React.TouchEvent<HTMLButtonElement>) {
    if (locked) return;
    longPressTriggered.current = false;
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      onOpenNaMenu(x, y);
    }, 500);
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLButtonElement>) {
    clearLongPressTimer();
    if (longPressTriggered.current) {
      // Evita el click "fantasma" que el navegador dispara tras un
      // long-press en móvil, que de otro modo alternaría PENDING⇄DONE justo
      // después de abrir el menú de "no aplica".
      e.preventDefault();
    }
  }

  function handleClick() {
    if (locked) return;
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    onToggle();
  }

  function handleContextMenu(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (locked) return;
    onOpenNaMenu(e.clientX, e.clientY);
  }

  return (
    <span className="relative mx-auto flex h-8 w-8 items-center justify-center">
      {celebrating && <span className="cell-burst" aria-hidden />}
      <button
        type="button"
        disabled={locked}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={clearLongPressTimer}
        onTouchMove={clearLongPressTimer}
        title={locked ? "Día cerrado: ya no se puede modificar" : undefined}
        aria-label={
          locked
            ? `Estado: ${statusLabel(status)}. Día cerrado, no se puede modificar.`
            : `Estado: ${statusLabel(status)}. Clic para alternar cumplido/pendiente.`
        }
        className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold leading-none transition-transform ${celebrating ? "cell-pop" : ""} ${locked ? "cursor-default" : "hover:scale-110 active:scale-95"} ${statusStyles(status)}`}
      >
        {status === "DONE" ? "✓" : status === "NA" ? "—" : "–"}
      </button>
    </span>
  );
}

function statusLabel(status: LogStatus): string {
  if (status === "DONE") return "cumplido";
  if (status === "NA") return "no aplica";
  return "pendiente";
}

function statusStyles(status: LogStatus): string {
  switch (status) {
    case "DONE":
      return "border-transparent bg-[#0ED66B] text-white shadow-[0_2px_10px_rgba(14,214,107,0.55)]";
    case "NA":
      return "border-black/20 bg-black/15 text-black/50";
    default:
      return "border-black/40 bg-white/40 text-black/50";
  }
}

function NaMenu({
  x,
  y,
  onSelect,
  onDismiss,
}: {
  x: number;
  y: number;
  onSelect: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    // Solo se escucha "click" (no "contextmenu"): así, right-clickear otra
    // celda mientras el menú está abierto simplemente lo reposiciona en un
    // único setState, en vez de competir con este listener por cerrarlo.
    window.addEventListener("click", onDismiss);
    return () => window.removeEventListener("click", onDismiss);
  }, [onDismiss]);

  return (
    <div
      className="fixed z-30 rounded-md border p-1 text-sm shadow-lg"
      style={{ top: y, left: x, background: "var(--surface)", borderColor: "var(--border)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onSelect}
        className="whitespace-nowrap rounded px-2 py-1 text-left"
        style={{ color: "var(--text)" }}
      >
        Marcar como no aplica
      </button>
    </div>
  );
}
