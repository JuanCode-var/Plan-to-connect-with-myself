import { BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREA_RGB, type BrainArea, type MyelinStage } from "./brainTokens";
import { NEURAL_FONT_BODY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY, scale } from "./tokens";

type AreaStat = {
  area: BrainArea;
  impulsosDeVida: number;
  diasActivos: number;
  isEstimatedDays: boolean;
  stage: MyelinStage;
  stageProgress: number;
};

function noteFor(stat: AreaStat): string {
  if (stat.stage === "Automático") return "Automático: ya lo haces casi sin pensar.";
  const prefix = stat.isEstimatedDays ? "~" : "";
  const suffix = stat.isEstimatedDays ? " (estimado)" : "";
  return `Día ${prefix}${stat.diasActivos} de 66 hacia el automatismo${suffix}`;
}

export function MyelinationColumn({ areaStats }: { areaStats: AreaStat[] }) {
  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: scale(12) }}>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
          MIELINIZACIÓN
        </span>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), color: NEURAL_TEXT_SECONDARY }}>meta: día 66</span>
      </div>

      <div className="flex flex-col" style={{ gap: scale(10) }}>
        {areaStats.map((stat) => {
          const color = BRAIN_AREA_COLOR[stat.area];
          const rgb = BRAIN_AREA_RGB[stat.area];
          return (
            <div
              key={stat.area}
              style={{
                borderRadius: scale(14),
                padding: `${scale(10)}px ${scale(14)}px`,
                background: `rgba(${rgb},.05)`,
                border: `1px solid rgba(${rgb},.25)`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(14), fontWeight: 600, color: "#ffffff" }}>
                  {BRAIN_AREA_LABEL[stat.area]}
                </span>
                <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), fontWeight: 600, color }}>
                  {stat.stage} · {stat.impulsosDeVida}
                </span>
              </div>
              <div
                className="overflow-hidden"
                style={{ marginTop: scale(8), height: scale(6), borderRadius: scale(3), background: "rgba(255,255,255,.08)" }}
              >
                <div
                  style={{
                    width: `${stat.stageProgress * 100}%`,
                    height: "100%",
                    borderRadius: scale(3),
                    background: color,
                    boxShadow: `0 0 ${scale(8)}px ${color}`,
                    transition: "width .5s ease-out",
                  }}
                />
              </div>
              <p className="m-0" style={{ marginTop: scale(6), fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), color: NEURAL_TEXT_SECONDARY }}>
                {noteFor(stat)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
