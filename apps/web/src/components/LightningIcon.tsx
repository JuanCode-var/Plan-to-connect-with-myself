/** Ícono de racha para las insignias de racha (TrackerMatrix, Dashboard,
 * Welcome) — distinto de FlameIcon, que sigue siendo "prioridad alta" en
 * PriorityIcon.tsx (son dos significados distintos que antes compartían un
 * solo dibujo). */
export function LightningIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M11.2 1.5 3.6 11.2c-.3.4 0 1 .5 1h4.1l-.9 6.3c-.1.6.6 1 1 .5l7.6-9.7c.3-.4 0-1-.5-1h-4.1l.9-6.3c.1-.6-.6-1-1-.5Z" />
    </svg>
  );
}
