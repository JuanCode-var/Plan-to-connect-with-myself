import type { Insight } from "../api/insights";

export function insightKey(insight: Insight): string {
  if (insight.type === "chain") return `chain-${insight.habitIds.join("-")}`;
  if (insight.type === "weekday") return `weekday-${insight.habitId}-${insight.weekdayLabel}`;
  return `emotion-${insight.emotion}`;
}
