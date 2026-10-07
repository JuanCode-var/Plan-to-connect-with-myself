import { useState } from "react";
import { useCreateCycle } from "../api/tracking";
import { todayISO } from "../lib/date";
import type { Cycle } from "../api/tracking";

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

/** Día siguiente al `endDate` del último ciclo existente, u hoy si no hay ninguno. */
function suggestStartDate(cycles: Cycle[]): string {
  // todayISO (lib/date.ts), no toISODate(new Date()): esta sí necesita el
  // calendario LOCAL, no UTC — toISODate de acá arriba solo es correcto para
  // fechas que ya son medianoche UTC pura (ver addDaysISO).
  if (cycles.length === 0) return todayISO();
  const latestEndISO = cycles.reduce((latest, cycle) => {
    const end = cycle.endDate.slice(0, 10);
    return end > latest ? end : latest;
  }, cycles[0].endDate.slice(0, 10));
  return addDaysISO(latestEndISO, 1);
}

const DEFAULT_DURATION_DAYS = 30;

export function NewCycleForm({
  cycles,
  onCreated,
  onCancel,
}: {
  cycles: Cycle[];
  onCreated: (cycle: Cycle) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(`Ciclo ${cycles.length + 1}`);
  const [startDate, setStartDate] = useState(() => suggestStartDate(cycles));
  const [durationDays, setDurationDays] = useState(DEFAULT_DURATION_DAYS);
  const createCycle = useCreateCycle();

  const safeDuration = Math.max(1, durationDays || 1);
  const endDate = addDaysISO(startDate, safeDuration - 1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startDate) return;
    createCycle.mutate(
      { name: name.trim(), startDate, endDate },
      { onSuccess: (cycle) => onCreated(cycle) },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-expand-in flex flex-col gap-3 rounded-xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <h2 className="font-display font-semibold">Nuevo ciclo</h2>

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
        Fecha de inicio
        <input
          type="date"
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
        Duración (días)
        <input
          type="number"
          min={1}
          className="rounded-lg border p-2"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          value={durationDays}
          onChange={(e) => setDurationDays(Number(e.target.value))}
        />
      </label>

      <p className="text-xs" style={{ color: "var(--text-2)" }}>
        Termina el {endDate}.
      </p>

      {createCycle.isError && (
        <p className="text-sm text-red-500">No se pudo crear el ciclo.</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={createCycle.isPending}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          Crear ciclo
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
