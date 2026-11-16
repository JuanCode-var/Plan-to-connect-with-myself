import { useId } from "react";

/** Ícono de cerebro (trazo, no relleno) para el centro del orbe — cian→violeta con glow, sección 3 del pedido. */
export function BrainGlyph({ size = 34 }: { size?: number }) {
  const uid = useId();
  const gradId = `neural-brain-grad-${uid}`;
  const glowId = `neural-brain-glow-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="4" y1="8" x2="44" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7DE3F4" />
          <stop offset="1" stopColor="#B7A4FF" />
        </linearGradient>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g
        stroke={`url(#${gradId})`}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      >
        <path d="M18 9c-4.5 0-7.5 3-7.8 6.4C7 16.3 5 19 5 22.5c0 3 1.8 5.4 4.4 6.4-.3 1-.4 1.8-.4 2.6 0 4.4 3.8 7.5 8 7.5 1.6 0 3-.4 4.2-1.1" />
        <path d="M30 9c4.5 0 7.5 3 7.8 6.4C41 16.3 43 19 43 22.5c0 3-1.8 5.4-4.4 6.4.3 1 .4 1.8 .4 2.6 0 4.4-3.8 7.5-8 7.5-1.6 0-3-.4-4.2-1.1" />
        <path d="M24 9v29" />
        <path d="M18 9c2 1.6 3.4 3.8 4 6.4" />
        <path d="M30 9c-2 1.6-3.4 3.8-4 6.4" />
        <path d="M11 22c2 .6 3.6 2 4.4 3.8" />
        <path d="M37 22c-2 .6-3.6 2-4.4 3.8" />
      </g>
    </svg>
  );
}
