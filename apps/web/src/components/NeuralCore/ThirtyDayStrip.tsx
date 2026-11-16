import { useState } from "react";
import { CORE_STATES } from "./brainTokens";
import type { DayCell } from "./useNeuralMapData";
import { NEURAL_FONT_BODY, NEURAL_TEXT_SECONDARY, scale } from "./tokens";

const STATE_COLOR = ["rgba(169,177,214,.3)", "#22D3EE", "#38BDF8", "#A78BFA", "#FDE68A"];

function dayNumber(dateISO: string): string {
  return String(Number(dateISO.split("-")[2]));
}

function formatDate(dateISO: string): string {
  const [, m, d] = dateISO.split("-");
  return `${d}/${m}`;
}

export function ThirtyDayStrip({ days }: { days: DayCell[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div
      style={{
        padding: `${scale(18)}px ${scale(22)}px`,
        borderRadius: scale(18),
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.10)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginBottom: scale(14) }}>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(14), fontWeight: 600, color: "#ffffff" }}>
          Últimos 30 días
        </span>
        <div className="flex flex-wrap items-center" style={{ gap: scale(14) }}>
          {CORE_STATES.map((s, i) => (
            <span key={s.key} className="flex items-center" style={{ gap: scale(6) }}>
              <span
                aria-hidden="true"
                style={{ width: scale(10), height: scale(10), borderRadius: "50%", background: STATE_COLOR[i] }}
              />
              <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), color: NEURAL_TEXT_SECONDARY }}>
                {s.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex" style={{ gap: scale(8), minWidth: scale(30 * 30) }}>
          {days.map((day, i) => {
            const isToday = i === days.length - 1;
            const color = STATE_COLOR[day.stateIndex];
            return (
              <div key={day.date} className="relative flex flex-col items-center" style={{ width: scale(22) }}>
                <button
                  type="button"
                  onClick={() => setOpenIndex((prev) => (prev === i ? null : i))}
                  aria-label={`${formatDate(day.date)}: ${CORE_STATES[day.stateIndex].label}, ${day.impulses} impulsos`}
                  style={{
                    width: scale(22),
                    height: scale(22),
                    borderRadius: "50%",
                    background: color,
                    boxShadow: day.stateKey === "pleno" ? "0 0 12px rgba(253,230,138,.7)" : undefined,
                    outline: isToday ? "2px solid #ffffff" : "none",
                    outlineOffset: isToday ? 3 : 0,
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
                <span
                  style={{
                    marginTop: scale(6),
                    fontFamily: NEURAL_FONT_BODY,
                    fontSize: scale(11),
                    fontWeight: isToday ? 600 : 400,
                    color: isToday ? "#ffffff" : NEURAL_TEXT_SECONDARY,
                    whiteSpace: "nowrap",
                  }}
                >
                  {isToday ? "Hoy" : dayNumber(day.date)}
                </span>

                {openIndex === i && (
                  <div
                    role="tooltip"
                    className="absolute z-10 whitespace-nowrap"
                    style={{
                      bottom: "100%",
                      marginBottom: scale(8),
                      padding: `${scale(8)}px ${scale(10)}px`,
                      borderRadius: scale(8),
                      background: "#0D1B31",
                      border: "1px solid rgba(255,255,255,.15)",
                      boxShadow: "0 10px 30px rgba(0,0,0,.4)",
                    }}
                  >
                    <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), fontWeight: 600, color: "#ffffff" }}>
                      {formatDate(day.date)} · {CORE_STATES[day.stateIndex].label}
                    </p>
                    <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(11), color: NEURAL_TEXT_SECONDARY }}>
                      {day.impulses} impulsos
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
