import { BRAIN_AREAS, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREA_RGB, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import type { ResonanceArea } from "./useCycleResonance";
import { EMPTY_AREA_STARTER_TIP } from "./versionesTokens";
import { goalForArea } from "./versionesLogic";

/**
 * "Diseña tu vN+1" (sección 6 del pedido) — los 6 botones de región eligen
 * `focusArea` (estado del padre, VersionsTab.tsx: la misma región pulsa en
 * la tarjeta "EN DISEÑO" de la fila de arriba). La meta y el consejo se
 * calculan del % real del área (versionesLogic.ts), nunca copiados del
 * mockup.
 */
export function VersionsDesignPanel({
  current,
  focusArea,
  onFocusArea,
  nextCycleNumber,
}: {
  current: ResonanceArea[];
  focusArea: BrainArea;
  onFocusArea: (area: BrainArea) => void;
  nextCycleNumber: number;
}) {
  const currentPercent = current.find((a) => a.area === focusArea)?.percent ?? null;
  const target = goalForArea(currentPercent);
  const areaLabel = BRAIN_AREA_LABEL[focusArea];
  const text = currentPercent
    ? `${areaLabel} hoy está en ${currentPercent} %. Una meta realista para tu v${nextCycleNumber}: ${target} %.`
    : `${areaLabel} aún no tiene circuitos. Tu v${nextCycleNumber} puede ser la versión que la enciende: meta inicial ${target} %.`;
  const tip = currentPercent
    ? `Elige 1 hábito ancla de ${areaLabel.toLowerCase()} y repítelo 4 días por semana. El mapa de Sinergias te dice cuál arrastra a los demás.`
    : EMPTY_AREA_STARTER_TIP[focusArea];

  return (
    <div
      className="flex h-full flex-col gap-3 rounded-[20px] p-5"
      style={{ background: "linear-gradient(160deg, rgba(124,92,255,0.18), rgba(34,211,238,0.05))", border: "1px dashed rgba(196,181,253,0.55)" }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER, fontFamily: NEURAL_FONT_BODY }}>
        DISEÑA TU V{nextCycleNumber} · ¿QUÉ REGIÓN QUIERES ENCENDER?
      </span>
      <div role="group" aria-label={`Región a encender en tu v${nextCycleNumber}`} className="grid grid-cols-3 gap-2">
        {BRAIN_AREAS.map((area) => {
          const on = focusArea === area;
          const color = BRAIN_AREA_COLOR[area];
          const rgb = BRAIN_AREA_RGB[area];
          return (
            <button
              key={area}
              type="button"
              aria-pressed={on}
              onClick={() => onFocusArea(area)}
              style={{
                height: 44,
                borderRadius: 12,
                cursor: "pointer",
                fontFamily: NEURAL_FONT_BODY,
                fontSize: 13,
                fontWeight: 600,
                color: on ? "#070B1F" : color,
                background: on ? color : `rgba(${rgb},0.07)`,
                border: `1px solid rgba(${rgb},${on ? 1 : 0.45})`,
                boxShadow: on ? `0 0 14px rgba(${rgb},0.5)` : "none",
              }}
            >
              {BRAIN_AREA_LABEL[area]}
            </button>
          );
        })}
      </div>
      <span style={{ fontSize: 14, lineHeight: 1.5, color: "#FFFFFF", fontFamily: NEURAL_FONT_BODY }}>{text}</span>
      <span style={{ fontSize: 12, lineHeight: 1.45, color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY }}>{tip}</span>
    </div>
  );
}
