import { HABIT_CATEGORY_COLORS, HABIT_CATEGORY_LABELS, type HabitCategory } from "../domain";

export function CategoryBadge({ category }: { category: HabitCategory }) {
  const colors = HABIT_CATEGORY_COLORS[category];
  return (
    <span
      className="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: colors.chipBg, color: colors.chipText }}
    >
      {HABIT_CATEGORY_LABELS[category]}
    </span>
  );
}
