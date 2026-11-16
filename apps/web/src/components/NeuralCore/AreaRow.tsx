import {
  BRAIN_AREA_COLOR,
  BRAIN_AREA_LABEL,
  BRAIN_AREA_RGB,
  BRAIN_FUNCTION_LABEL,
  BRAIN_REGION_LABEL,
  myelinStage,
  type BrainArea,
} from "./brainTokens";
import { NEURAL_FONT_BODY, NEURAL_TEXT_SECONDARY, scale } from "./tokens";

export function AreaRow({
  area,
  impulsosHoy,
  impulsosDeVida,
  active,
}: {
  area: BrainArea;
  impulsosHoy: number;
  impulsosDeVida: number;
  active: boolean;
}) {
  const color = BRAIN_AREA_COLOR[area];
  const rgb = BRAIN_AREA_RGB[area];
  const stage = myelinStage(impulsosDeVida);

  return (
    <div
      className="flex flex-col justify-center"
      style={{
        height: scale(76),
        borderRadius: scale(16),
        padding: `0 ${scale(18)}px`,
        gap: scale(4),
        background: active ? `rgba(${rgb},.12)` : `rgba(${rgb},.05)`,
        border: `1px solid rgba(${rgb},${active ? 0.7 : 0.28})`,
        transition: "background .3s ease-out, border-color .3s ease-out",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center" style={{ gap: scale(10) }}>
          <span
            aria-hidden="true"
            style={{
              width: scale(10),
              height: scale(10),
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 ${scale(8)}px ${color}`,
              flexShrink: 0,
            }}
          />
          <span className="truncate" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(16), fontWeight: 700, color: "#ffffff" }}>
            {BRAIN_AREA_LABEL[area]}
            <span style={{ color: NEURAL_TEXT_SECONDARY, fontWeight: 400 }}> → {BRAIN_REGION_LABEL[area]}</span>
          </span>
        </div>
        <span
          className="shrink-0"
          style={{
            fontFamily: NEURAL_FONT_BODY,
            fontSize: scale(12),
            fontWeight: 600,
            color,
            background: `rgba(${rgb},.14)`,
            border: `1px solid rgba(${rgb},.35)`,
            borderRadius: scale(999),
            padding: `${scale(4)}px ${scale(10)}px`,
          }}
        >
          {stage} · {impulsosDeVida}
        </span>
      </div>
      <p className="m-0 truncate" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(13), color: NEURAL_TEXT_SECONDARY }}>
        {BRAIN_FUNCTION_LABEL[area]} · hoy {impulsosHoy} imp.
      </p>
    </div>
  );
}
