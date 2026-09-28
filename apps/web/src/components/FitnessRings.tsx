export type FitnessRingData = { pct: number; color: string };

/**
 * Anillos concéntricos estilo Apple Fitness (Move/Exercise/Stand): cada
 * anillo es un círculo de fondo tenue + un arco de progreso que se llena en
 * sentido horario desde arriba. `rings[0]` es el más externo. El color de
 * cada anillo se pasa por prop (no se decide acá) para poder reusar los
 * colores de categoría del dominio (`HABIT_CATEGORY_COLORS`) sin
 * duplicarlos. Colores vía `style` (no atributos `stroke=`) para que
 * `var(--...)` siempre resuelva.
 */
export function FitnessRings({
  rings,
  size = 104,
  strokeWidth = 10,
  gap = 4,
}: {
  rings: FitnessRingData[];
  size?: number;
  strokeWidth?: number;
  gap?: number;
}) {
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {rings.map((ring, index) => {
        const radius = center - strokeWidth / 2 - index * (strokeWidth + gap);
        const circumference = 2 * Math.PI * radius;
        const clamped = Math.max(0, Math.min(1, ring.pct));
        const dash = circumference * clamped;
        return (
          <g key={index}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              style={{ stroke: "var(--border)" }}
            />
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              transform={`rotate(-90 ${center} ${center})`}
              style={{ stroke: ring.color, transition: "stroke-dasharray 600ms ease-out" }}
            />
          </g>
        );
      })}
    </svg>
  );
}
