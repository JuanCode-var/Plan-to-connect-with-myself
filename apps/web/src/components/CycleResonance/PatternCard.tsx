import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { patternText, type PatternResult } from "./eegAnalysis";

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: color,
          boxShadow: `0 0 8px ${color}`,
          transition: "width .5s ease",
        }}
      />
    </div>
  );
}

/** "Tu patrón" — entre semana vs. fin de semana, sección 6 del pedido. */
export function PatternCard({ pattern }: { pattern: PatternResult }) {
  return (
    <div
      className="flex h-full flex-col gap-2.5"
      style={{ padding: 20, borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
    >
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
        TU PATRÓN
      </span>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between" style={{ fontSize: 13 }}>
            <span style={{ color: "#E6E9F5" }}>Entre semana</span>
            <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontWeight: 700, color: "#38BDF8" }}>
              {pattern.hasWeekday ? `${pattern.weekdayAvg}%` : "—"}
            </span>
          </div>
          <Bar value={pattern.weekdayAvg} color="#38BDF8" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between" style={{ fontSize: 13 }}>
            <span style={{ color: "#E6E9F5" }}>Fines de semana</span>
            <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontWeight: 700, color: "#FB5C8C" }}>
              {pattern.hasWeekend ? `${pattern.weekendAvg}%` : "—"}
            </span>
          </div>
          <Bar value={pattern.weekendAvg} color="#FB5C8C" />
        </div>
      </div>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, lineHeight: 1.5, color: NEURAL_TEXT_SECONDARY }}>{patternText(pattern)}</span>
    </div>
  );
}
