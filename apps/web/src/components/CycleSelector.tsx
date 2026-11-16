import type { Cycle } from "../api/tracking";
import { NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_TEXT } from "./NeuralCore/tokens";

function formatDayMonth(dateISO: string): string {
  // `dateISO` llega como ISO completo ("2026-11-01T00:00:00.000Z") — sin el
  // slice(0, 10), el split("-") de abajo partía también la porción de hora
  // ("01T00:00:00.000Z"), mostrando fechas rotas como "01T00:00:00.000Z/11".
  const [, month, day] = dateISO.slice(0, 10).split("-");
  return `${day}/${month}`;
}

export function CycleSelector({
  cycles,
  selectedCycleId,
  onChange,
  variant = "default",
}: {
  cycles: Cycle[];
  selectedCycleId: string | undefined;
  onChange: (cycleId: string) => void;
  // "default" = tokens var(--...) de siempre (Resumen/Seguimiento dependen
  // de ese default); "neural" = paleta de Núcleo Neural (la usa Metas.tsx).
  // Mismo patrón que `colors` en SectionIntro.tsx/SectionPager.tsx.
  variant?: "default" | "neural";
}) {
  const style =
    variant === "neural"
      ? { background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }
      : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" };
  return (
    <select
      className="rounded-lg border p-2 text-sm"
      style={style}
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
