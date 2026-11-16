import { useId } from "react";
import type { HabitPriorityLevel } from "../../domain";
import { orbSegmentPath } from "./math";
import { BrainGlyph } from "./BrainGlyph";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_PRIORITY_COLORS, NEURAL_TEXT_SECONDARY, scale } from "./tokens";

type OrbHabit = { id: string; priority: HabitPriorityLevel };

export function NeuralOrb({
  habits,
  isLit,
  doneCount,
  total,
}: {
  habits: OrbHabit[];
  isLit: (habitId: string) => boolean;
  doneCount: number;
  total: number;
}) {
  const uid = useId();
  const glowId = `neural-ring-glow-${uid}`;
  const haloId = `neural-halo-grad-${uid}`;
  const coreId = `neural-core-grad-${uid}`;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <svg
      viewBox="0 0 290 290"
      width={scale(290)}
      height={scale(290)}
      role="img"
      aria-label={`Anillo de ${total} hábitos: ${doneCount} completados`}
    >
      <defs>
        <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.35} />
          <stop offset="55%" stopColor="#7C5CFF" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={coreId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2A1F66" />
          <stop offset="70%" stopColor="#120E33" />
          <stop offset="100%" stopColor="#0A0A22" />
        </radialGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx={145} cy={145} r={104} fill={`url(#${haloId})`} className="neural-halo" aria-hidden="true" />

      <g filter={`url(#${glowId})`} aria-hidden="true">
        {habits.map((habit, index) => (
          <path
            key={habit.id}
            d={orbSegmentPath(index, habits.length)}
            fill="none"
            stroke={NEURAL_PRIORITY_COLORS[habit.priority]}
            strokeWidth={14}
            strokeLinecap="round"
            className="neural-ring-segment"
            style={{ strokeOpacity: isLit(habit.id) ? 1 : 0.16 }}
          />
        ))}
      </g>

      <circle
        cx={145}
        cy={145}
        r={86}
        fill={`url(#${coreId})`}
        stroke="rgba(167,139,250,.35)"
        strokeWidth={1.5}
        aria-hidden="true"
      />

      <foreignObject x={145 - 17} y={96} width={34} height={34} aria-hidden="true">
        <BrainGlyph size={34} />
      </foreignObject>

      <text
        x={145}
        y={182}
        textAnchor="middle"
        fill="#ffffff"
        style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 30, fontWeight: 700 }}
        aria-hidden="true"
      >
        {percent}%
      </text>
      <text
        x={145}
        y={200}
        textAnchor="middle"
        fill={NEURAL_TEXT_SECONDARY}
        style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 11, letterSpacing: "2px" }}
        aria-hidden="true"
      >
        ACTIVIDAD
      </text>
    </svg>
  );
}
