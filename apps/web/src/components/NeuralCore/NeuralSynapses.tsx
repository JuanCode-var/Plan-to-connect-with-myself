import type { HabitPriorityLevel } from "../../domain";
import { NEURAL_PRIORITY_COLORS, scale } from "./tokens";

const SYNAPSE_PATHS: Record<HabitPriorityLevel, { d: string; endX: number; endY: number }> = {
  ALTA: { d: "M0 199 C50 199 40 131 90 131", endX: 90, endY: 131 },
  MEDIA: { d: "M0 199 C50 199 40 235 90 235", endX: 90, endY: 235 },
  BAJA: { d: "M0 199 C50 199 40 339 90 339", endX: 90, endY: 339 },
};

/** Tres curvas del orbe hacia cada tarjeta de prioridad (sección 4 del pedido). */
export function NeuralSynapses({ active }: { active: Record<HabitPriorityLevel, boolean> }) {
  return (
    <svg viewBox="0 0 90 398" width={scale(90)} height={scale(398)} aria-hidden="true">
      {(Object.keys(SYNAPSE_PATHS) as HabitPriorityLevel[]).map((level) => {
        const { d, endX, endY } = SYNAPSE_PATHS[level];
        const color = NEURAL_PRIORITY_COLORS[level];
        const isActive = active[level];
        return (
          <g key={level}>
            <path
              d={d}
              fill="none"
              stroke={color}
              className="neural-synapse"
              style={{
                strokeWidth: isActive ? 2.5 : 1.5,
                strokeOpacity: isActive ? 1 : 0.45,
              }}
            />
            <circle cx={endX} cy={endY} r={4} fill={color} />
          </g>
        );
      })}
    </svg>
  );
}
