import { useEffect, useState } from "react";

export type FitnessRingData = { pct: number; color: string };

/**
 * Anillos concéntricos estilo Apple Fitness (Move/Exercise/Stand): cada
 * anillo es un círculo de fondo tenue + un arco de progreso que se llena en
 * sentido horario desde arriba. `rings[0]` es el más externo. El color de
 * cada anillo se pasa por prop (no se decide acá) para poder reusar los
 * colores por nivel de prioridad del dominio (`HABIT_PRIORITY_COLORS`) sin
 * duplicarlos. Colores vía `style` (no atributos `stroke=`) para que
 * `var(--...)` siempre resuelva.
 *
 * Arranca en 0 y sube a los valores reales recién montado (como
 * ProgressRing en /dashboard): sin esto, el primer render ya pinta el
 * porcentaje final y la transición de `stroke-dasharray` nunca se ve — solo
 * se notaba al tildar un hábito después, nunca al abrir la pantalla.
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {rings.map((ring, index) => {
        const radius = center - strokeWidth / 2 - index * (strokeWidth + gap);
        const circumference = 2 * Math.PI * radius;
        const clamped = mounted ? Math.max(0, Math.min(1, ring.pct)) : 0;
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
              style={{ stroke: ring.color, color: ring.color, transition: "stroke-dasharray 600ms ease-out" }}
              className="chart-glow"
            />
          </g>
        );
      })}
    </svg>
  );
}
