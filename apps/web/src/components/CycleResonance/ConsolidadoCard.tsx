import { BRAIN_AREA_COLOR, BRAIN_IDENTITY_PHRASE, BRAIN_REGION_LABEL, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import type { habitStrengthFor } from "./resonanceTokens";

export type TopHabit = {
  name: string;
  area: BrainArea;
  percent: number;
  strength: ReturnType<typeof habitStrengthFor>;
};

/**
 * "Tu ruta consolidada" (antes "Tu autopista neuronal", renombrado junto con
 * la etapa de mielinización Autopista→Consolidado — pedido explícito) — el
 * hábito con mayor % del ciclo (desempate por días cumplidos, resuelto por
 * el llamador — ver CerebroDelCicloTab.tsx). La frase de identidad reutiliza
 * BRAIN_IDENTITY_PHRASE, la misma que ya usa el Cerebro Interactivo en
 * "último evento" — no se inventa una nueva.
 */
export function ConsolidadoCard({ habit }: { habit: TopHabit | null }) {
  if (!habit) {
    return (
      <div
        style={{
          padding: "20px 22px",
          borderRadius: 20,
          background: "linear-gradient(160deg, rgba(56,189,248,0.10), rgba(124,92,255,0.04))",
          border: "1px solid rgba(56,189,248,0.25)",
        }}
      >
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
          TU RUTA CONSOLIDADA
        </span>
        <p className="m-0" style={{ marginTop: 10, fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>
          Todavía no tienes un hábito dominante este ciclo — en cuanto marques algunos días, el más sólido aparece acá.
        </p>
      </div>
    );
  }

  const color = BRAIN_AREA_COLOR[habit.area];

  return (
    <div
      style={{
        padding: "20px 22px",
        borderRadius: 20,
        background: `linear-gradient(160deg, ${color}24, rgba(124,92,255,0.06))`,
        border: `1px solid ${color}66`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
          TU RUTA CONSOLIDADA
        </span>
        <span
          style={{
            fontFamily: NEURAL_FONT_BODY,
            fontSize: 12,
            fontWeight: 600,
            color,
            padding: "5px 10px",
            borderRadius: 999,
            background: `${color}24`,
          }}
        >
          {habit.strength.label}
        </span>
      </div>
      <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>{habit.name}</span>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>
        {BRAIN_REGION_LABEL[habit.area]} · {habit.percent}% este ciclo
      </span>
      <svg aria-hidden="true" width="100%" height={44} viewBox="0 0 436 44" preserveAspectRatio="xMinYMid meet">
        <path d="M8 22 C70 4 120 40 190 22 S320 6 400 22" fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={10} strokeLinecap="round" />
        <path className="resonance-axon-flow" d="M8 22 C70 4 120 40 190 22 S320 6 400 22" fill="none" stroke="#7DE3F4" strokeWidth={3} strokeLinecap="round" />
        <circle cx={8} cy={22} r={6} fill={color} />
        <circle cx={400} cy={22} r={10} fill="none" stroke={color} strokeWidth={2} />
        <circle cx={400} cy={22} r={5} fill="#FFFFFF" />
      </svg>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 15, fontStyle: "italic", color: "#E6E9F5" }}>
        &ldquo;{BRAIN_IDENTITY_PHRASE[habit.area]}&rdquo;
      </span>
    </div>
  );
}
