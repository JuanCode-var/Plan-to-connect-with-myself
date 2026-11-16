import type { WeekBar } from "./useNeuralCoreData";
import { NEURAL_FONT_BODY, NEURAL_TEXT_SECONDARY, scale } from "./tokens";

const BAR_AREA_HEIGHT = scale(90);
const MIN_BAR_HEIGHT = scale(6);
const BAR_HEIGHT_SCALE = 0.9; // de la especificación: altura = % · 0.9px

export function WeekActivityCard({ bars }: { bars: WeekBar[] }) {
  return (
    <div
      style={{
        padding: `${scale(20)}px ${scale(22)}px`,
        borderRadius: scale(18),
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <div className="flex items-baseline justify-between" style={{ marginBottom: scale(14) }}>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(14), fontWeight: 600, color: "#ffffff" }}>
          Últimos 7 días
        </span>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), color: NEURAL_TEXT_SECONDARY }}>
          % completado
        </span>
      </div>

      <div className="flex items-end" style={{ gap: scale(10), height: BAR_AREA_HEIGHT }}>
        {bars.map((bar, index) => {
          const height = Math.max(MIN_BAR_HEIGHT, scale(bar.rate * 100 * BAR_HEIGHT_SCALE));
          return (
            <div key={index} className="flex flex-1 flex-col items-center justify-end" style={{ height: BAR_AREA_HEIGHT }}>
              <div
                style={{
                  width: "100%",
                  height,
                  borderRadius: scale(6),
                  transition: "height .5s ease-out",
                  background: bar.isToday ? "linear-gradient(180deg,#22D3EE,#7C5CFF)" : "rgba(124,92,255,.45)",
                  boxShadow: bar.isToday ? "0 0 16px rgba(34,211,238,.45)" : undefined,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex" style={{ gap: scale(10), marginTop: scale(8) }}>
        {bars.map((bar, index) => (
          <span
            key={index}
            className="flex-1 text-center"
            style={{
              fontFamily: NEURAL_FONT_BODY,
              fontSize: scale(11),
              fontWeight: bar.isToday ? 600 : 400,
              color: bar.isToday ? "#22D3EE" : NEURAL_TEXT_SECONDARY,
            }}
          >
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
}
