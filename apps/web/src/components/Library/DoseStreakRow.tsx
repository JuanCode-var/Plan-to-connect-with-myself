import { NEURAL_FONT_BODY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import type { WeekStreakDay } from "./doseSelector";

const WEEKDAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"];

/** "RACHA DE DOSIS" (Fase 2, columna izquierda) — 7 círculos L-D, dorados los cumplidos, punteado el de hoy sin hacer todavía. */
export function DoseStreakRow({ days }: { days: WeekStreakDay[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>RACHA DE DOSIS</span>
      <div className="flex gap-2">
        {days.map((day, i) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <span
              aria-label={day.done ? "Dosis cumplida" : day.isToday ? "Hoy, todavía sin dosis" : "Sin dosis"}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                boxSizing: "border-box",
                background: day.done ? "#FDE68A" : "transparent",
                border: day.done ? "none" : day.isToday ? "2px dashed #FDE68A" : "1px solid rgba(255,255,255,0.14)",
                boxShadow: day.done ? "0 0 12px rgba(253,230,138,0.6)" : "none",
              }}
            />
            <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 11, color: day.isToday ? "#FFFFFF" : NEURAL_TEXT_SECONDARY }}>
              {WEEKDAY_LETTERS[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
