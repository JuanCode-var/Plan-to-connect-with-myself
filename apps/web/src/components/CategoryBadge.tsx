import { HABIT_CATEGORY_LABELS, HABIT_CATEGORY_PRIORITY, HABIT_PRIORITY_COLORS, type HabitCategory } from "../domain";
import { PriorityIcon } from "./PriorityIcon";

/**
 * Badge de fondo neutro con el ÍCONO de nivel de prioridad coloreado (llama/
 * hoja/punto, ver PriorityIcon.tsx) con HABIT_PRIORITY_COLORS (3 colores
 * bien distintos, uno por nivel) — punto medio entre "toda la fila pintada"
 * (lo que se sacó) y "sin nada de color" (se sentía demasiado plano): el
 * acento de color vive en la forma pequeña, no en el bloque grande, así no
 * compite con el estado cumplido/pendiente de cada celda.
 */
export function CategoryBadge({ category }: { category: HabitCategory }) {
  const level = HABIT_CATEGORY_PRIORITY[category];
  const color = HABIT_PRIORITY_COLORS[level];
  return (
    <span
      className="category-chip inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 px-2 py-0.5 text-xs font-semibold"
      style={{ borderColor: color, color: "var(--text-2)" }}
    >
      <span style={{ color }}>
        <PriorityIcon level={level} />
      </span>
      {HABIT_CATEGORY_LABELS[category]}
    </span>
  );
}
