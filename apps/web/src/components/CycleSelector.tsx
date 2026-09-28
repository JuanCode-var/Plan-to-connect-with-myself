import type { Cycle } from "../api/tracking";

function formatDayMonth(dateISO: string): string {
  const [, month, day] = dateISO.split("-");
  return `${day}/${month}`;
}

export function CycleSelector({
  cycles,
  selectedCycleId,
  onChange,
}: {
  cycles: Cycle[];
  selectedCycleId: string | undefined;
  onChange: (cycleId: string) => void;
}) {
  return (
    <select
      className="rounded-lg border p-2 text-sm"
      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
      value={selectedCycleId ?? ""}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Ciclo"
    >
      {cycles.map((cycle) => (
        <option key={cycle.id} value={cycle.id}>
          {cycle.name} ({formatDayMonth(cycle.startDate)}–{formatDayMonth(cycle.endDate)})
          {cycle.isActive ? " · activo" : ""}
        </option>
      ))}
    </select>
  );
}
