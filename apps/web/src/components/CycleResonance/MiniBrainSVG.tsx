import { useId } from "react";
import { BRAIN_LOBE_PATH, BRAIN_STEM_PATH, INSULA_ELLIPSE } from "../NeuralCore/brainPaths";
import { BRAIN_AREAS, BRAIN_AREA_COLOR, type BrainArea } from "../NeuralCore/brainTokens";
import { areaFillOpacity, isAreaDashed } from "./versionesLogic";

const LOBE_AREAS = BRAIN_AREAS.filter((a) => a !== "esp") as Exclude<BrainArea, "esp">[];

/**
 * Mini cerebro 2D de "Versiones de ti" (sección 1 del pedido) — reutiliza
 * las MISMAS formas que el Cerebro Interactivo (brainPaths.ts: BRAIN_LOBE_PATH/
 * BRAIN_STEM_PATH/INSULA_ELLIPSE), nunca redibujadas a mano. A diferencia de
 * BrainSVG.tsx (que colorea por `impulsosDeVida` con constelación de
 * estrellas), esta versión condensada colorea directo por el % del área en
 * ESTE ciclo/versión — sin estrellas ni surcos, pensada para verse chica
 * (200×160) dentro de una tarjeta de 240px.
 */
export function MiniBrainSVG({
  percentByArea,
  ghost = false,
  pulseArea = null,
  ariaLabel,
}: {
  percentByArea: Record<BrainArea, number | null>;
  ghost?: boolean;
  pulseArea?: BrainArea | null;
  ariaLabel: string;
}) {
  const uid = useId();

  return (
    <svg viewBox="0 0 600 480" width={200} height={160} role="img" aria-label={ariaLabel} style={{ alignSelf: "center" }}>
      <path d={BRAIN_STEM_PATH} fill="#1A1F3D" stroke="rgba(255,255,255,0.15)" strokeWidth={3} aria-hidden="true" />

      {LOBE_AREAS.map((area) => {
        const color = BRAIN_AREA_COLOR[area];
        const percent = percentByArea[area];
        return (
          <path
            key={area}
            id={`${uid}-${area}`}
            className={pulseArea === area ? "vs-pulse" : undefined}
            d={BRAIN_LOBE_PATH[area]}
            fill={color}
            fillOpacity={areaFillOpacity(percent, ghost)}
            stroke={color}
            strokeOpacity={ghost ? 0.3 : 1}
            strokeWidth={3}
            strokeDasharray={isAreaDashed(percent) ? "10 8" : undefined}
          />
        );
      })}

      <ellipse
        className={pulseArea === "esp" ? "vs-pulse" : undefined}
        cx={INSULA_ELLIPSE.cx}
        cy={INSULA_ELLIPSE.cy}
        rx={INSULA_ELLIPSE.rx}
        ry={INSULA_ELLIPSE.ry}
        fill={BRAIN_AREA_COLOR.esp}
        fillOpacity={areaFillOpacity(percentByArea.esp, ghost)}
        stroke={BRAIN_AREA_COLOR.esp}
        strokeOpacity={ghost ? 0.3 : 1}
        strokeWidth={3}
        strokeDasharray="8 6"
      />
    </svg>
  );
}
