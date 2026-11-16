import type { HabitIdentityStats } from "../api/habits";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR } from "./NeuralCore/brainTokens";
import { NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import type { HabitCategory } from "../domain";

/** "Acciones por tu identidad · esta semana" (antes "Votos...", renombrado — pedido explícito) — impulsos reales de esta semana, por área. */
export function CompassActions({ stats }: { stats: HabitIdentityStats | undefined }) {
  const total = stats?.weeklyActions.total ?? 0;
  const byCategory = stats?.weeklyActions.byCategory ?? {};
  const segments = (Object.entries(byCategory) as [HabitCategory, number][]).filter(([, v]) => v > 0);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl p-5" style={{ background: NEURAL_CARD_BG, border: `1px solid ${NEURAL_CARD_BORDER}` }}>
      <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1.5px" }}>
        Acciones por tu identidad · esta semana
      </span>
      <div className="flex items-baseline gap-2">
        <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 44, fontWeight: 700, color: NEURAL_TEXT }}>{total}</span>
        <span style={{ fontSize: 14, color: NEURAL_TEXT_SECONDARY }}>acciones</span>
      </div>
      {segments.length > 0 && (
        <div className="flex h-2 overflow-hidden rounded-full">
          {segments.map(([category, value]) => (
            <div key={category} style={{ width: `${(value / total) * 100}%`, background: BRAIN_AREA_COLOR[AREA_OF_CATEGORY[category]] }} />
          ))}
        </div>
      )}
      <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY, lineHeight: 1.5 }}>
        Cada hábito cumplido es una acción de la persona que quieres ser. No necesitas perfección, solo constancia.
      </p>
    </div>
  );
}
