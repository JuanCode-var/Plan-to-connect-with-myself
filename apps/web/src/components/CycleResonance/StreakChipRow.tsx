import { BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREA_RGB, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";

// Mismos umbrales de día que RewireCard.tsx (7/21/30/66/90) — acá solo se
// necesita la ETAPA alcanzada para el chip, no la barra completa.
const MILESTONES = [
  { d: 7, label: "Primera semana" },
  { d: 21, label: "Sendero" },
  { d: 30, label: "Un mes" },
  { d: 66, label: "Automático" },
  { d: 90, label: "Ciclo completo" },
];
function stageLabel(days: number): string | null {
  let last: string | null = null;
  for (const m of MILESTONES) if (days >= m.d) last = m.label;
  return last;
}

type StreakDef = { area: BrainArea; zeroCopy: string; nonZeroCopy: string };
const STREAKS: StreakDef[] = [
  { area: "fis", zeroCopy: "tu circuito espera su primer impulso", nonZeroCopy: "el movimiento se automatiza con la repetición" },
  { area: "hab", zeroCopy: "un impulso hoy lo enciende", nonZeroCopy: "la práctica reorganiza cómo lo procesás" },
  { area: "emo", zeroCopy: "cada registro fortalece este circuito", nonZeroCopy: "ponerle nombre calma la amígdala" },
];

function StreakChip({ area, days, copy }: { area: BrainArea; days: number; copy: string }) {
  const color = BRAIN_AREA_COLOR[area];
  const rgb = BRAIN_AREA_RGB[area];
  const stage = stageLabel(days);

  return (
    <div
      className="flex items-center gap-3.5"
      style={{ height: 84, padding: "0 18px", borderRadius: 16, background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},${days === 0 ? 0.28 : 0.4})` }}
    >
      <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 30, fontWeight: 700, color, width: 44, textAlign: "center" }}>{days}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>
          {days === 1 ? "día" : "días"} seguidos · {BRAIN_AREA_LABEL[area]}
        </span>
        <span className="truncate" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>
          {copy}
        </span>
      </div>
      <span
        className="shrink-0 whitespace-nowrap"
        style={{
          fontFamily: NEURAL_FONT_BODY,
          fontSize: 12,
          fontWeight: 600,
          color,
          padding: "5px 10px",
          borderRadius: 999,
          ...(stage
            ? { background: `rgba(${rgb},0.14)` }
            : { border: `1px dashed rgba(${rgb},0.6)` }),
        }}
      >
        {stage ?? "En espera"}
      </span>
    </div>
  );
}

/** Fila de rachas (entrenamiento/estudio/registro emocional) — los 3 contadores de SPECIFIC_COUNTERS que NO llevan la tarjeta completa de "circuito en recableado" (esos son solo alcohol/apuestas, ver RewireCard.tsx). */
export function StreakChipRow({ trainingDays, studyDays, emotionalLogDays }: { trainingDays: number; studyDays: number; emotionalLogDays: number }) {
  const values = [trainingDays, studyDays, emotionalLogDays];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {STREAKS.map((s, i) => (
        <StreakChip key={s.area} area={s.area} days={values[i]} copy={values[i] === 0 ? s.zeroCopy : s.nonZeroCopy} />
      ))}
    </div>
  );
}
