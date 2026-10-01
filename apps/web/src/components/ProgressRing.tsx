import { useEffect, useId, useState } from "react";

/**
 * Anillo de progreso circular para el % general del ciclo (0..1). Reemplaza
 * la tarjeta plana de % general: mismo dato (`completionRate`), presentación
 * distinta — ver mockups/dashboard-direccion-impulso-clinico.html.
 *
 * Interactivo a propósito (pedido explícito: "la rueda" del Resumen se
 * sentía estática): arranca en 0 y se llena hasta el valor real al montar
 * (mismo timing que los anillos de TodayProgress, 600ms), con un degradado
 * dorado de dos tonos en vez de un trazo plano, y un leve scale-up al pasar
 * el mouse.
 */
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
  const gradientId = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  const center = size / 2;

  // Arranca en 0 y sube al valor real en el siguiente frame: es lo que hace
  // que el llenado se vea como una animación de "carga" al entrar a la
  // pantalla, en vez de aparecer ya completo.
  const [animatedValue, setAnimatedValue] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimatedValue(clamped));
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const dash = circumference * animatedValue;

  return (
    <div
      className="group relative shrink-0 transition-transform duration-200 ease-out hover:scale-105"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dasharray 600ms ease-out", color: "var(--accent)" }}
          className="chart-glow"
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
