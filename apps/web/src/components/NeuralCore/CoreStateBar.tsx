import { CORE_STATES } from "./brainTokens";
import { NEURAL_FONT_BODY, NEURAL_TEXT_SECONDARY, scale } from "./tokens";

const MARKS = CORE_STATES.filter((s) => s.minPercent > 0);

export function CoreStateBar({ percent, maximoHoy }: { percent: number; maximoHoy: number }) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div style={{ marginTop: scale(10) }}>
      <div
        className="relative overflow-hidden"
        style={{ height: scale(8), borderRadius: scale(4), background: "rgba(255,255,255,.08)" }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: "100%",
            borderRadius: scale(4),
            background: "linear-gradient(90deg,#22D3EE,#A78BFA,#FDE68A)",
            transition: "width .5s ease-out",
          }}
        />
      </div>
      <div className="relative" style={{ height: scale(18), marginTop: scale(4) }}>
        {MARKS.map((mark) => {
          const points = Math.round((maximoHoy * mark.minPercent) / 100);
          return (
            <span
              key={mark.key}
              className="absolute whitespace-nowrap"
              style={{
                left: `${mark.minPercent}%`,
                transform: mark.minPercent >= 100 ? "translateX(-100%)" : "translateX(-50%)",
                fontFamily: NEURAL_FONT_BODY,
                fontSize: scale(11),
                color: NEURAL_TEXT_SECONDARY,
              }}
            >
              {points} · {mark.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
