import { useEffect, useRef, useState } from "react";
import type { Cycle } from "../api/tracking";
import { shortDateParts } from "../lib/goalCycle";
import { NEURAL_BG, NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

function formatCycleRange(startISO: string, endISO: string): string {
  const start = shortDateParts(startISO);
  const end = shortDateParts(endISO);
  return start.month === end.month
    ? `${start.day} – ${end.day} ${end.month}`
    : `${start.day} ${start.month} – ${end.day} ${end.month}`;
}

/**
 * Selector de ciclo de Metas (mockup 15): pastilla "Ciclo 5 · 1 – 30 nov" +
 * chip verde "activo" + flecha — reemplaza el <select> nativo que usan
 * Tracker/Dashboard (ver CycleSelector.tsx) solo acá, porque el chip
 * necesita markup propio que un <select> no puede mostrar dentro de su
 * opción cerrada. Mismo patrón de dropdown con click-outside que
 * ProfileMenu.tsx.
 */
export function CyclePillSelector({
  cycles,
  selectedCycleId,
  onChange,
}: {
  cycles: Cycle[];
  selectedCycleId: string | undefined;
  onChange: (cycleId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = cycles.find((c) => c.id === selectedCycleId);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  if (!selected) return null;

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold"
        style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
      >
        <span>
          {selected.name} · {formatCycleRange(selected.startDate, selected.endDate)}
        </span>
        {selected.isActive && (
          <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: "#34D399", color: "#06231A" }}>
            activo
          </span>
        )}
        <span aria-hidden style={{ color: NEURAL_TEXT_SECONDARY }}>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Elegir ciclo"
          className="popover-in absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border py-1 shadow-lg"
          style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER }}
        >
          {cycles.map((cycle) => (
            <button
              key={cycle.id}
              type="button"
              role="option"
              aria-selected={cycle.id === selectedCycleId}
              onClick={() => {
                onChange(cycle.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm"
              style={{
                color: cycle.isActive ? NEURAL_TEXT : NEURAL_TEXT_SECONDARY,
                background: cycle.id === selectedCycleId ? "rgba(34,211,238,.08)" : "transparent",
              }}
            >
              <span>
                {cycle.name} · {formatCycleRange(cycle.startDate, cycle.endDate)}
              </span>
              {cycle.isActive && (
                <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "#34D399", color: "#06231A" }}>
                  activo
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
