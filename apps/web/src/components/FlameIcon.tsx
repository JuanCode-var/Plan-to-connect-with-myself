/** Ícono de racha compartido por TrackerMatrix (insignia por hábito) y
 * TodayProgress (racha de días perfectos) — un solo dibujo, no dos. */
export function FlameIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 1.5c1 3.2-3.2 4.3-3.2 8A3.2 3.2 0 0 0 10 12.7a3.2 3.2 0 0 0 2.7-4.9c1.4.9 2.3 2.6 2.3 4.4a5 5 0 0 1-10 0c0-3.9 2.9-5.4 3.9-7.7.4-.9.8-1.9 1.1-3Z" />
    </svg>
  );
}
