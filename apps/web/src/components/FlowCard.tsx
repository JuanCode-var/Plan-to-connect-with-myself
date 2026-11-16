import { useState } from "react";
import { useCreateJournalEntry, useJournalEntries } from "../api/journal";
import { JournalDatePicker } from "./JournalDatePicker";
import { formatHoursMinutes, topFlowActivities } from "../lib/journalSummary";
import { mondayOfWeek, weekDaysISO } from "../lib/journalWeek";
import { NEURAL_BG, NEURAL_CYAN, NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import { todayISO } from "../lib/date";

const QUICK_ADD = [15, 30, 45, 60, 90];

/**
 * "Flow" (mockup 17g) — el número grande se arma sumando chips +15/+30/...
 * en vez de un input numérico suelto, igual que pide el mockup. "Reiniciar"
 * también es lo que vuelve a habilitar el formulario después de guardar
 * (mismo patrón que GratitudeCard: guardar no abre automáticamente "un
 * registro nuevo", hay que pedirlo).
 */
export function FlowCard() {
  const [date, setDate] = useState(todayISO());
  const [minutes, setMinutes] = useState(0);
  const [activity, setActivity] = useState<string | null>(null);
  const [customActivity, setCustomActivity] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saved, setSaved] = useState<{ minutes: number; weekTotal: number } | null>(null);

  const createEntry = useCreateJournalEntry();
  const { data: allFlowEntries } = useJournalEntries({ kind: "flow" });

  const activities = topFlowActivities(allFlowEntries ?? []);
  const weekDays = weekDaysISO(mondayOfWeek(date));
  const existingWeekTotal = (allFlowEntries ?? [])
    .filter((e) => weekDays.includes(e.date.slice(0, 10)))
    .reduce((sum, e) => sum + (e.flowMinutes ?? 0), 0);

  function reset() {
    setMinutes(0);
    setActivity(null);
    setCustomActivity("");
    setShowCustomInput(false);
    setSaved(null);
  }

  function handleSave() {
    if (minutes <= 0) return;
    const finalActivity = showCustomInput ? customActivity.trim() || undefined : (activity ?? undefined);
    createEntry.mutate(
      { date, flowMinutes: minutes, flowActivity: finalActivity },
      { onSuccess: () => setSaved({ minutes, weekTotal: existingWeekTotal + minutes }) },
    );
  }

  const locked = !!saved;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: NEURAL_LAVENDER }}>
          Flow
        </span>
        <JournalDatePicker
          date={date}
          onChange={(d) => {
            setDate(d);
            reset();
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="font-display m-0 text-2xl font-bold sm:text-[28px]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
          ¿Cuánto tiempo estuviste en flow?
        </h2>
        <p className="font-reading m-0 text-base italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_LAVENDER }}>
          Esa concentración profunda donde el tiempo se te pasó sin darte cuenta.
        </p>
      </div>

      <div className="flex items-baseline gap-2.5">
        <span className="font-display text-5xl font-bold sm:text-[56px]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
          {minutes}
        </span>
        <span className="text-lg" style={{ color: NEURAL_TEXT_SECONDARY }}>
          minutos
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ADD.map((add) => (
          <button
            key={add}
            type="button"
            disabled={locked}
            onClick={() => setMinutes((m) => m + add)}
            className="rounded-full border px-4 py-2 text-sm font-bold disabled:opacity-40"
            style={{ borderColor: "rgba(34,211,238,.45)", color: NEURAL_CYAN }}
          >
            +{add}
          </button>
        ))}
      </div>

      {minutes > 0 && !locked && (
        <button type="button" onClick={reset} className="self-start text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Reiniciar
        </button>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          ¿En qué? (opcional)
        </span>
        <div className="flex flex-wrap gap-2">
          {activities.map((a) => {
            const selected = !showCustomInput && activity === a;
            return (
              <button
                key={a}
                type="button"
                disabled={locked}
                onClick={() => {
                  setShowCustomInput(false);
                  setActivity(selected ? null : a);
                }}
                className="rounded-full border px-3.5 py-1.5 text-sm font-semibold disabled:opacity-60"
                style={selected ? { background: NEURAL_CYAN, borderColor: NEURAL_CYAN, color: "#070B1F" } : { borderColor: "rgba(255,255,255,.14)", color: NEURAL_TEXT }}
              >
                {a}
              </button>
            );
          })}
          <button
            type="button"
            disabled={locked}
            onClick={() => {
              setActivity(null);
              setShowCustomInput(true);
            }}
            className="rounded-full border px-3.5 py-1.5 text-sm font-semibold disabled:opacity-60"
            style={showCustomInput ? { background: NEURAL_CYAN, borderColor: NEURAL_CYAN, color: "#070B1F" } : { borderColor: "rgba(255,255,255,.14)", color: NEURAL_TEXT }}
          >
            + Otra
          </button>
        </div>
        {showCustomInput && (
          <input
            autoFocus
            disabled={locked}
            value={customActivity}
            onChange={(e) => setCustomActivity(e.target.value)}
            placeholder="¿En qué estuviste?"
            className="rounded-xl border p-2.5 text-sm"
            style={{ background: NEURAL_BG, borderColor: "rgba(255,255,255,.14)", color: NEURAL_TEXT }}
          />
        )}
      </div>

      {saved && (
        <p className="goal-achieved-in m-0 text-sm font-semibold" style={{ color: NEURAL_GOLD }}>
          ✓ {saved.minutes} minutos guardados. Tu semana ya suma {formatHoursMinutes(saved.weekTotal)} de enfoque profundo.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={locked || minutes <= 0 || createEntry.isPending}
          onClick={handleSave}
          className="rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40"
          style={locked ? { background: "rgba(255,255,255,.08)", color: NEURAL_TEXT_SECONDARY } : { background: NEURAL_CYAN, color: "#070B1F" }}
        >
          {locked ? "✓ Guardado" : createEntry.isPending ? "Guardando…" : "Guardar"}
        </button>
        {locked && (
          <button type="button" onClick={reset} className="text-sm font-semibold" style={{ color: NEURAL_CYAN }}>
            Registrar otra sesión
          </button>
        )}
      </div>

      {createEntry.isError && (
        <p className="text-sm" style={{ color: "#F87171" }}>
          No se pudo guardar.
        </p>
      )}
    </div>
  );
}
