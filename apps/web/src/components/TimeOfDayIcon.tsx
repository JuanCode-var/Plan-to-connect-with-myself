import type { TimeOfDayVariant } from "../lib/greeting";

/** Sol / atardecer / luna según la hora — acompaña el saludo tanto en el
 * shell (chico) como en /welcome (grande). Un solo ícono por variante,
 * trazo consistente con el resto de la app (stroke, no relleno sólido). */
export function TimeOfDayIcon({ variant, size = 18 }: { variant: TimeOfDayVariant; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (variant === "sun") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4.5" />
        <line x1="12" y1="2.5" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="21.5" y2="12" />
        <line x1="5.1" y1="5.1" x2="6.8" y2="6.8" />
        <line x1="17.2" y1="17.2" x2="18.9" y2="18.9" />
        <line x1="5.1" y1="18.9" x2="6.8" y2="17.2" />
        <line x1="17.2" y1="6.8" x2="18.9" y2="5.1" />
      </svg>
    );
  }

  if (variant === "sunset") {
    return (
      <svg {...common}>
        <line x1="12" y1="3" x2="12" y2="9" />
        <path d="M8 9.5l1.8 1.8" />
        <path d="M16 9.5l-1.8 1.8" />
        <path d="M5 13.5a7 7 0 0 1 14 0" />
        <line x1="3" y1="13.5" x2="21" y2="13.5" />
        <line x1="3" y1="17.5" x2="21" y2="17.5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M18.5 14.2A8 8 0 1 1 9.8 5.5a6.3 6.3 0 0 0 8.7 8.7z" />
    </svg>
  );
}
