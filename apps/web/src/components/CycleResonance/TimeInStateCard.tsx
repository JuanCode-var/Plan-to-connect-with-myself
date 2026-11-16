import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER } from "../NeuralCore/tokens";
import type { StateCount } from "./eegAnalysis";

/** "Tiempo en cada estado" — sección 6 del pedido. `states` ya viene de mayor a menor (Flow primero), ver eegAnalysis.ts::timeInState. */
export function TimeInStateCard({ states }: { states: StateCount[] }) {
  return (
    <div
      className="flex h-full flex-col gap-3"
      style={{ padding: 20, borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
    >
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
        TIEMPO EN CADA ESTADO
      </span>
      <div className="flex overflow-hidden" style={{ height: 14, borderRadius: 7, gap: 2 }}>
        {states.map((s) =>
          s.count > 0 ? (
            <div key={s.key} style={{ flexGrow: s.count, flexBasis: 0, background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
          ) : null,
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {states.map((s) => (
          <div key={s.key} className="flex items-center gap-2" style={{ fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span className="flex-1" style={{ color: "#E6E9F5" }}>
              {s.label}
            </span>
            <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontWeight: 700, color: "#FFFFFF" }}>
              {s.count} {s.count === 1 ? "día" : "días"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
