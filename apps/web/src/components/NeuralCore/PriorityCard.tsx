import type { HabitPriorityLevel } from "../../domain";
import {
  NEURAL_FONT_BODY,
  NEURAL_FONT_DISPLAY,
  NEURAL_PRIORITY_COLORS,
  NEURAL_PRIORITY_IMPULSE_LABELS,
  NEURAL_PRIORITY_LABELS,
  NEURAL_PRIORITY_RGB,
  NEURAL_TEXT_SECONDARY,
  scale,
} from "./tokens";

const DONUT_CIRCUMFERENCE = 138.2;

function pendingLabel(done: number, total: number): string {
  if (total === 0) return "Sin hábitos hoy";
  const pending = total - done;
  if (pending === 0) return "Completada";
  return pending === 1 ? "1 pendiente" : `${pending} pendientes`;
}

export function PriorityCard({ level, done, total }: { level: HabitPriorityLevel; done: number; total: number }) {
  const color = NEURAL_PRIORITY_COLORS[level];
  const rgb = NEURAL_PRIORITY_RGB[level];
  const dash = total === 0 ? 0 : (done / total) * DONUT_CIRCUMFERENCE;

  return (
    <div
      className="flex items-center"
      style={{
        height: scale(90),
        borderRadius: scale(16),
        padding: `0 ${scale(22)}px 0 ${scale(16)}px`,
        gap: scale(16),
        background: `rgba(${rgb},.06)`,
        border: `1px solid rgba(${rgb},.30)`,
      }}
    >
      <svg width={scale(56)} height={scale(56)} viewBox="0 0 56 56" aria-hidden="true">
        <circle cx={28} cy={28} r={22} fill="none" stroke={`rgba(${rgb},.18)`} strokeWidth={6} />
        <circle
          cx={28}
          cy={28}
          r={22}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${DONUT_CIRCUMFERENCE}`}
          transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dasharray .45s ease-out" }}
        />
      </svg>

      <div className="min-w-0 flex-1">
        <p className="m-0 truncate" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(16), fontWeight: 600, color: "#ffffff" }}>
          {NEURAL_PRIORITY_LABELS[level]}
        </p>
        <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(13), color: NEURAL_TEXT_SECONDARY }}>
          {pendingLabel(done, total)} · {NEURAL_PRIORITY_IMPULSE_LABELS[level]}
        </p>
      </div>

      <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: scale(30), fontWeight: 700, color }}>
        {done}/{total}
      </span>
    </div>
  );
}
