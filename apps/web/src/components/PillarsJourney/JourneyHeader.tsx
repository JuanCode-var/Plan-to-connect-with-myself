import { Link } from "react-router-dom";
import { NEURAL_CYAN, NEURAL_GOLD, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { PILLARS } from "./pillarsJourneyShared";
import type { PillarKey } from "../../api/compass";

export function JourneyHeader({ sealed, activePillar }: { sealed: Record<PillarKey, string | null>; activePillar: PillarKey | null }) {
  const sealedCount = PILLARS.filter((p) => !!sealed[p.key]).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link to="/identidad" className="text-sm font-semibold" style={{ color: NEURAL_CYAN }}>
            ← Mi identidad
          </Link>
          <h1 className="m-0 font-display text-3xl font-bold sm:text-4xl" style={{ color: NEURAL_TEXT }}>
            Mi núcleo de identidad
          </h1>
          <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Tres pilares. Léelos despacio, una idea a la vez.
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-right">
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_TEXT_SECONDARY, letterSpacing: "1.5px" }}>
            Recorrido de hoy
          </span>
          <span className="text-lg font-bold" style={{ color: NEURAL_TEXT }}>
            {sealedCount} de 3 pilares
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-0">
        {PILLARS.map((p, i) => {
          const isSealed = !!sealed[p.key];
          const isActive = activePillar === p.key;
          return (
            <div key={p.key} className="flex flex-1 items-center" style={{ maxWidth: 220 }}>
              <div className="flex flex-col items-center gap-2" style={{ minWidth: 88 }}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold"
                  style={
                    isSealed
                      ? { background: NEURAL_GOLD, color: "#070B1F" }
                      : isActive
                        ? { background: "transparent", border: `2px solid ${NEURAL_CYAN}`, color: NEURAL_CYAN, boxShadow: `0 0 0 4px rgba(34,211,238,.18)` }
                        : { background: "transparent", border: "2px dashed rgba(196,181,253,.45)", color: "rgba(196,181,253,.8)" }
                  }
                >
                  {isSealed ? "✓" : p.glyph}
                </span>
                <span className="text-xs font-semibold" style={{ color: isActive || isSealed ? NEURAL_TEXT : NEURAL_TEXT_SECONDARY }}>
                  {p.name}
                </span>
              </div>
              {i < PILLARS.length - 1 && (
                <div
                  className="-mt-6 h-px flex-1"
                  style={isSealed ? { background: NEURAL_GOLD } : { borderTop: "2px dashed rgba(196,181,253,.3)" }}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
