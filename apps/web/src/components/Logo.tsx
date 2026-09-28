/** Marca de la app: un círculo "en ciclo" (arco abierto + un punto) en el
 * color de acento — reutilizado por AppShell, Login y Register para que la
 * identidad visual sea la misma dentro y fuera del login. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
        <circle
          cx="14"
          cy="14"
          r="10"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.6"
          strokeDasharray="54 10"
          strokeLinecap="round"
          transform="rotate(-90 14 14)"
        />
        <circle cx="14" cy="4" r="2.8" fill="var(--accent)" />
      </svg>
      {!compact && (
        <span className="font-display text-lg font-bold" style={{ color: "var(--text)" }}>
          Dr. Axón
        </span>
      )}
    </div>
  );
}
