import { HABIT_CATEGORY_LABELS, HABIT_PRIORITY_COLORS, type HabitCategory, type HabitPriorityLevel } from "../domain";
import { PriorityIcon } from "./PriorityIcon";

/**
 * Badge de fondo neutro con el ÍCONO de nivel de prioridad coloreado (llama/
 * hoja/punto, ver PriorityIcon.tsx) con HABIT_PRIORITY_COLORS (3 colores
 * bien distintos, uno por nivel) — punto medio entre "toda la fila pintada"
 * (lo que se sacó) y "sin nada de color" (se sentía demasiado plano): el
 * acento de color vive en la forma pequeña, no en el bloque grande, así no
 * compite con el estado cumplido/pendiente de cada celda. `priority` se pasa
 * aparte de `category` porque ya no se deriva de ella (son dos campos
 * independientes del hábito: área de vida vs. urgencia).
 */
export function CategoryBadge({ category, priority }: { category: HabitCategory; priority: HabitPriorityLevel }) {
  const color = HABIT_PRIORITY_COLORS[priority];
  return (
    <span
      className="category-chip inline-flex items-center gap-1 whitespace-nowrap rounded-full border-2 px-2 py-0.5 text-xs font-semibold"
      style={{ borderColor: color, color: "var(--text-2)" }}
    >
      <span style={{ color }}>
        <PriorityIcon level={priority} />
      </span>
      {HABIT_CATEGORY_LABELS[category]}
    </span>
  );
}
