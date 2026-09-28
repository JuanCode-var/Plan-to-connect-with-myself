/** Anillo de progreso circular para el % general del ciclo (0..1). Reemplaza
 * la tarjeta plana de % general: mismo dato (`completionRate`), presentación
 * distinta — ver mockups/dashboard-direccion-impulso-clinico.html. */
export function ProgressRing({
  value,
  size = 128,
  strokeWidth = 11,
  label = "general",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  const dash = circumference * clamped;
  const center = size / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono-num text-[28px] font-semibold" style={{ color: "var(--text)" }}>
          {Math.round(clamped * 100)}%
        </span>
        <span className="text-[10px] tracking-wide uppercase" style={{ color: "var(--text-2)" }}>
          {label}
        </span>
      </div>
    </div>
  );
}
