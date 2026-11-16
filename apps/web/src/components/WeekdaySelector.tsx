import { WEEKDAY_LABELS_SHORT } from "../domain";
import { NEURAL_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * Selector de "días de la semana" de un hábito (ej. Entrenamiento solo
 * lunes/miércoles/viernes) — `null` significa "todos los días" (default,
 * mismo valor que ya tenían los hábitos creados antes de este campo). Nunca
 * deja vaciar la selección del todo (un hábito sin ningún día activo no
 * tiene sentido): al intentar sacar el último día seleccionado, no hace
 * nada.
 */
export function WeekdaySelector({
  value,
  onChange,
}: {
  value: number[] | null;
  onChange: (value: number[] | null) => void;
}) {
  const selected = new Set(value ?? ALL_DAYS);

  function toggle(day: number) {
    const next = new Set(selected);
    if (next.has(day)) {
      if (next.size === 1) return;
      next.delete(day);
    } else {
      next.add(day);
    }
    onChange(next.size === 7 ? null : Array.from(next).sort((a, b) => a - b));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        {WEEKDAY_LABELS_SHORT.map((label, day) => {
          const isSelected = selected.has(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              aria-pressed={isSelected}
              className="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-transform active:scale-95"
              style={{
                background: isSelected ? NEURAL_CYAN : NEURAL_BG,
                borderColor: isSelected ? NEURAL_CYAN : NEURAL_CARD_BORDER,
                color: isSelected ? NEURAL_BG : NEURAL_TEXT_SECONDARY,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        {value === null
          ? "Todos los días"
          : `Solo ${value.length} día${value.length === 1 ? "" : "s"} por semana — el resto se trata como "no aplica" sin que tengas que marcarlo`}
      </p>
    </div>
  );
}
