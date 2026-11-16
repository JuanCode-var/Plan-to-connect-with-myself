import type { CSSProperties } from "react";
import { synapsePathD } from "./brainLayout";
import { BRAIN_AREAS, BRAIN_AREA_COLOR, type BrainArea } from "./brainTokens";
import type { BrainImpulse } from "./useBrainImpulseEngine";
import { scale, scalePathD } from "./tokens";

const IMPULSE_PATHS: Record<BrainArea, string> = Object.fromEntries(
  BRAIN_AREAS.map((area) => [area, `path('${scalePathD(synapsePathD(area))}')`]),
) as Record<BrainArea, string>;

const DOT_SIZE = scale(10);

/**
 * Impulsos viajando por la sinapsis real de su área (CSS `offset-path`,
 * sección 4) — el destello de la región al llegar vive dentro de
 * BrainSVG.tsx (es el propio contorno de la región, no un círculo aparte
 * como en el Núcleo Neural de paso 1).
 */
export function BrainImpulseLayer({ impulses }: { impulses: BrainImpulse[] }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {impulses.map((imp) => {
        const color = BRAIN_AREA_COLOR[imp.area];
        const style: CSSProperties = {
          position: "absolute",
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 ${scale(8)}px ${color}, 0 0 ${scale(22)}px ${color}`,
          offsetPath: IMPULSE_PATHS[imp.area],
          offsetAnchor: "50% 50%",
          offsetRotate: "0deg",
        } as CSSProperties;
        return <div key={imp.id} className="brain-impulse" style={style} />;
      })}
    </div>
  );
}
