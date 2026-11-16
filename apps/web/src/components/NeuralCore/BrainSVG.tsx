import { useId, useMemo, useState } from "react";
import {
  BRAIN_LOBE_PATH,
  BRAIN_REGION_LABEL_POS,
  BRAIN_STEM_PATH,
  BRAIN_SULCI,
  INSULA_ELLIPSE,
} from "./brainPaths";
import { BRAIN_AREAS, BRAIN_AREA_COLOR, BRAIN_REGION_NAME, type BrainArea } from "./brainTokens";
import { buildStars } from "./starField";
import { scale } from "./tokens";

const LOBE_AREAS = BRAIN_AREAS.filter((a) => a !== "esp") as Exclude<BrainArea, "esp">[];

function regionOpacity(impulsosHoy: number): number {
  return 0.1 + 0.62 * Math.min(1, impulsosHoy / 12);
}

/**
 * El cerebro del Cerebro Interactivo, ahora con la MISMA constelación de
 * sinapsis que Mi Mapa Neuronal (pedido explícito: ver las redes formarse
 * adentro del cerebro, en vivo, al chequear un hábito — no solo el relleno
 * subiendo de opacidad). Reutiliza buildStars/starField.ts tal cual
 * (semilla fija por área, nada duplicado) — como crece con
 * `impulsosDeVida` (de por vida, no el contador de hoy), cada impulso real
 * que llega agranda la red visible acá mismo, en el momento.
 */
export function BrainSVG({
  displayedAreaPoints,
  impulsosDeVida,
  flashingAreas,
  totalImpulsosHoy,
  coreStateLabel,
}: {
  displayedAreaPoints: Record<BrainArea, number>;
  impulsosDeVida: Record<BrainArea, number>;
  flashingAreas: Set<BrainArea>;
  totalImpulsosHoy: number;
  coreStateLabel: string;
}) {
  const uid = useId();
  const glowId = `brain-flash-glow-${uid}`;
  const [reduceMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const starsByArea = useMemo(
    () => Object.fromEntries(BRAIN_AREAS.map((a) => [a, buildStars(a, impulsosDeVida[a])])) as Record<
      BrainArea,
      ReturnType<typeof buildStars>
    >,
    [impulsosDeVida],
  );

  return (
    <svg
      viewBox="0 0 600 480"
      width={scale(600)}
      height={scale(480)}
      role="img"
      aria-label={`Cerebro con 6 regiones. ${totalImpulsosHoy} impulsos hoy, estado ${coreStateLabel}`}
    >
      <defs>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {LOBE_AREAS.map((area) => (
          <clipPath key={area} id={`${uid}-clip-${area}`}>
            <path d={BRAIN_LOBE_PATH[area]} />
          </clipPath>
        ))}
        <clipPath id={`${uid}-clip-esp`}>
          <ellipse cx={INSULA_ELLIPSE.cx} cy={INSULA_ELLIPSE.cy} rx={INSULA_ELLIPSE.rx} ry={INSULA_ELLIPSE.ry} />
        </clipPath>
      </defs>

      <path d={BRAIN_STEM_PATH} fill="#1A1F3D" stroke="rgba(255,255,255,.15)" strokeWidth={1.5} aria-hidden="true" />

      {LOBE_AREAS.map((area) => {
        const color = BRAIN_AREA_COLOR[area];
        const flashing = flashingAreas.has(area);
        return (
          <path
            key={area}
            d={BRAIN_LOBE_PATH[area]}
            fill={color}
            fillOpacity={regionOpacity(displayedAreaPoints[area])}
            stroke={color}
            strokeWidth={flashing ? 4 : 1.5}
            filter={flashing ? `url(#${glowId})` : undefined}
            className="brain-region"
            style={{ transition: "fill-opacity .5s ease-out, stroke-width .15s ease-out" }}
          />
        );
      })}

      <ellipse
        cx={INSULA_ELLIPSE.cx}
        cy={INSULA_ELLIPSE.cy}
        rx={INSULA_ELLIPSE.rx}
        ry={INSULA_ELLIPSE.ry}
        fill={BRAIN_AREA_COLOR.esp}
        fillOpacity={regionOpacity(displayedAreaPoints.esp)}
        stroke={BRAIN_AREA_COLOR.esp}
        strokeWidth={flashingAreas.has("esp") ? 4 : 1.5}
        strokeDasharray="5 4"
        filter={flashingAreas.has("esp") ? `url(#${glowId})` : undefined}
        className="brain-region"
        style={{ transition: "fill-opacity .5s ease-out, stroke-width .15s ease-out" }}
      />

      {/* Constelación: una estrella por cada ~3 impulsos de por vida de esa
          área, recortada a su propia forma — crece en vivo con
          impulsosDeVida, misma semilla que Mi Mapa Neuronal así no "saltan"
          de posición entre renders. */}
      <g aria-hidden="true">
        {BRAIN_AREAS.map((area) => (
          <g key={area} clipPath={`url(#${uid}-clip-${area})`}>
            {starsByArea[area].map((s, i) => (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={s.size / 2}
                fill={BRAIN_AREA_COLOR[area]}
                className={reduceMotion ? undefined : "neural-star-twinkle"}
                style={
                  reduceMotion
                    ? undefined
                    : { animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s` }
                }
              />
            ))}
          </g>
        ))}
      </g>

      <g stroke="rgba(255,255,255,.14)" strokeWidth={1.5} fill="none" aria-hidden="true">
        {BRAIN_SULCI.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      <g aria-hidden="true">
        {BRAIN_AREAS.map((area) => {
          const pos = BRAIN_REGION_LABEL_POS[area];
          return (
            <text
              key={area}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              fill="#ffffff"
              style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: pos.fontSize, fontWeight: 600 }}
            >
              {BRAIN_REGION_NAME[area]}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
