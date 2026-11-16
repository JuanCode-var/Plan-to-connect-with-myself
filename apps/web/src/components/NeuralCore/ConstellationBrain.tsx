import { useState } from "react";
import { BRAIN_LOBE_PATH, BRAIN_REGION_LABEL_POS, BRAIN_STEM_PATH } from "./brainPaths";
import { BRAIN_AREAS, BRAIN_AREA_COLOR, BRAIN_REGION_NAME, type BrainArea } from "./brainTokens";
import { buildStars } from "./starField";
import { NEURAL_FONT_BODY, scale, scalePathD } from "./tokens";

const LOBE_AREAS = BRAIN_AREAS.filter((a) => a !== "esp") as Exclude<BrainArea, "esp">[];
const INSULA_CLIP = `ellipse(${scale(38)}px ${scale(20)}px at ${scale(255)}px ${scale(242)}px)`;

/**
 * Cerebro "constelación" de Mi Mapa Neuronal (sección 4 del pedido):
 * reutiliza las MISMAS formas/colores del Cerebro Interactivo
 * (brainPaths.ts/brainTokens.ts — nada duplicado), con un estilo propio
 * (contorno tenue, fill 5%, stroke 40%) y una capa de estrellas por región
 * con semilla fija (starField.ts) recortada al contorno real de esa región
 * vía `clip-path`.
 */
export function ConstellationBrain({
  impulsosDeVida,
  brightness,
  totalImpulsos,
}: {
  impulsosDeVida: Record<BrainArea, number>;
  brightness: Record<BrainArea, number>;
  totalImpulsos: number;
}) {
  const [reduceMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  return (
    <div
      role="img"
      aria-label={`Mapa neuronal con 6 regiones; ${totalImpulsos} impulsos acumulados.`}
      className="relative"
      style={{ width: scale(600), height: scale(480) }}
    >
      <svg viewBox="0 0 600 480" width={scale(600)} height={scale(480)} className="absolute inset-0" aria-hidden="true">
        <path d={BRAIN_STEM_PATH} fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.12)" strokeWidth={1.2} />
        {LOBE_AREAS.map((area) => (
          <path
            key={area}
            d={BRAIN_LOBE_PATH[area]}
            fill={BRAIN_AREA_COLOR[area]}
            fillOpacity={0.05}
            stroke={BRAIN_AREA_COLOR[area]}
            strokeOpacity={0.4}
            strokeWidth={1.2}
          />
        ))}
        <ellipse
          cx={255}
          cy={242}
          rx={38}
          ry={20}
          fill={BRAIN_AREA_COLOR.esp}
          fillOpacity={0.05}
          stroke={BRAIN_AREA_COLOR.esp}
          strokeOpacity={0.4}
          strokeWidth={1.2}
          strokeDasharray="5 4"
        />
      </svg>

      {BRAIN_AREAS.map((area) => {
        const stars = buildStars(area, impulsosDeVida[area]);
        const clip = area === "esp" ? INSULA_CLIP : `path('${scalePathD(BRAIN_LOBE_PATH[area])}')`;
        return (
          <div
            key={area}
            className="absolute inset-0"
            aria-hidden="true"
            style={{ clipPath: clip, opacity: brightness[area], transition: "opacity .8s ease-out" }}
          >
            {stars.map((s, i) => (
              <span
                key={i}
                className={reduceMotion ? undefined : "neural-star-twinkle"}
                style={{
                  position: "absolute",
                  left: scale(s.x),
                  top: scale(s.y),
                  width: scale(s.size),
                  height: scale(s.size),
                  borderRadius: "50%",
                  background: BRAIN_AREA_COLOR[area],
                  boxShadow: `0 0 ${scale(s.size * 2)}px ${BRAIN_AREA_COLOR[area]}`,
                  animationDuration: reduceMotion ? undefined : `${s.duration}s`,
                  animationDelay: reduceMotion ? undefined : `${s.delay}s`,
                }}
              />
            ))}
          </div>
        );
      })}

      <svg viewBox="0 0 600 480" width={scale(600)} height={scale(480)} className="absolute inset-0" aria-hidden="true">
        {BRAIN_AREAS.map((area) => {
          const pos = BRAIN_REGION_LABEL_POS[area];
          return (
            <text
              key={area}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              fill="#ffffff"
              style={{ fontFamily: NEURAL_FONT_BODY, fontSize: pos.fontSize, fontWeight: 600 }}
            >
              {BRAIN_REGION_NAME[area]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
