import type { HabitPriorityLevel } from "../domain";
import { FlameIcon } from "./FlameIcon";

/**
 * Ícono neutro por nivel de prioridad (ALTA/MEDIA/BAJA) — reemplaza el chip
 * de color por categoría (ver CategoryBadge.tsx, TrackerMatrix.tsx): el
 * color fuerte se reserva para el estado cumplido/pendiente, acá solo hay
 * forma + `currentColor`, así el ícono hereda el gris neutro del texto que
 * lo rodea en vez de traer su propio color.
 */
export function PriorityIcon({ level, size = 13 }: { level: HabitPriorityLevel; size?: number }) {
  if (level === "ALTA") return <FlameIcon size={size} />;

  if (level === "MEDIA") {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M17 3c-8 0-13 4-13 11 0 1.3.3 2.4.8 3.3.4-3.5 2.4-6.6 5.6-8.6-2.4 2.6-3.7 5.8-3.9 9.3.3.1.6.1 1 .1C15 18.1 17 12 17 3Z" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <circle cx="10" cy="10" r="4.5" />
    </svg>
  );
}
