import { useState } from "react";
import { useSaveCompassReflection, type Weakness } from "../api/compass";
import { buildInterruptionMessage } from "../lib/compassMessages";
import { todayISO } from "../lib/date";
import { markMessageShownToday } from "../lib/compassTriggers";

/**
 * Único trigger de "Mi Brújula" que no es un toast de un solo sentido — 2-3
 * días seguidos sin cumplir un hábito ameritan preguntar, no solo avisar.
 * Banner descartable (no modal: no bloquea nada), con el mensaje a sí mismo
 * del usuario arriba y un campo corto opcional para "¿qué se interpuso?",
 * que queda en el diario de reflexiones (CompassReflection, `context`).
 */
export function CompassInterruptionPrompt({
  habitId,
  habitName,
  weaknesses,
  onDismiss,
}: {
  habitId: string;
  habitName: string;
  weaknesses: Weakness[];
  onDismiss: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const saveReflection = useSaveCompassReflection();

  function dismiss() {
    markMessageShownToday(habitId, todayISO());
    onDismiss();
  }

  function handleSave() {
    if (!answer.trim()) {
      dismiss();
      return;
    }
    saveReflection.mutate(
      { answer: answer.trim(), date: todayISO(), context: `habit_interrupted:${habitId}` },
      { onSettled: dismiss },
    );
  }

  return (
    <div
      className="panel-expand-in flex flex-col gap-3 rounded-xl border p-4"
      style={{ background: "var(--accent-soft)", borderColor: "var(--accent)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-reading text-base leading-relaxed" style={{ color: "var(--text)" }}>
          {buildInterruptionMessage(weaknesses)}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-xs font-semibold"
          style={{ color: "var(--text-2)" }}
          title="Cerrar"
        >
          ✕
        </button>
      </div>
      <p className="text-xs" style={{ color: "var(--text-2)" }}>
        Llevas un par de días sin "{habitName}". ¿Qué se interpuso? (opcional)
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Lo que se te ocurra, sin vueltas"
          className="min-w-0 flex-1 rounded-lg border bg-transparent p-2 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saveReflection.isPending}
          className="rounded-lg px-3 py-2 text-xs font-bold tracking-wide uppercase disabled:opacity-60"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          {saveReflection.isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
