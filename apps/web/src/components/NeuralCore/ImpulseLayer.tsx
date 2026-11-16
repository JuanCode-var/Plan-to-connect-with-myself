import type { CSSProperties } from "react";
import type { HabitPriorityLevel } from "../../domain";
import type { NeuralFlash, NeuralImpulse } from "./useImpulseEngine";
import { NEURAL_PRIORITY_COLORS, NEURAL_PRIORITY_RGB, scale } from "./tokens";

// Camino de cada impulso dentro de la capa combinada orbe+sinapsis (380×398
// en la especificación original) — desde el punto de la sinapsis hacia el
// anillo. Solo la Y de arranque cambia por prioridad (131/235/339); el
// resto de la geometría es compartida. Se regenera con `scale()` porque es
// CSS/HTML plano (no un SVG con viewBox, que escalaría gratis).
const IMPULSE_X = { x0: 380, x1: 330, x2: 340, x3: 290, x4: 268 };
const IMPULSE_MID_Y = 199;
const IMPULSE_START_Y: Record<HabitPriorityLevel, number> = { ALTA: 131, MEDIA: 235, BAJA: 339 };

function buildImpulsePath(level: HabitPriorityLevel): string {
  const y0 = scale(IMPULSE_START_Y[level]);
  const midY = scale(IMPULSE_MID_Y);
  const x0 = scale(IMPULSE_X.x0);
  const x1 = scale(IMPULSE_X.x1);
  const x2 = scale(IMPULSE_X.x2);
  const x3 = scale(IMPULSE_X.x3);
  const x4 = scale(IMPULSE_X.x4);
  return `path('M${x0} ${y0} C${x1} ${y0} ${x2} ${midY} ${x3} ${midY} L${x4} ${midY}')`;
}

const IMPULSE_PATHS: Record<HabitPriorityLevel, string> = {
  ALTA: buildImpulsePath("ALTA"),
  MEDIA: buildImpulsePath("MEDIA"),
  BAJA: buildImpulsePath("BAJA"),
};

const IMPULSE_DOT_SIZE = scale(10);
const FLASH_LEFT = scale(18);
const FLASH_TOP = scale(72);
const FLASH_SIZE = scale(254);
const FLASH_BORDER = Math.max(1.5, scale(3));

/**
 * Capa absoluta sobre el orbe+sinapsis que pinta los impulsos viajando (CSS
 * `offset-path`, sección 7) y los destellos del anillo al llegar.
 * `pointer-events: none` para no interferir con nada clickeable.
 */
export function ImpulseLayer({ impulses, flashes }: { impulses: NeuralImpulse[]; flashes: NeuralFlash[] }) {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ width: scale(380), height: scale(398) }} aria-hidden="true">
      {impulses.map((imp) => {
        const color = NEURAL_PRIORITY_COLORS[imp.priority];
        const style: CSSProperties = {
          position: "absolute",
          width: IMPULSE_DOT_SIZE,
          height: IMPULSE_DOT_SIZE,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 ${scale(8)}px ${color}, 0 0 ${scale(22)}px ${color}`,
          offsetPath: IMPULSE_PATHS[imp.priority],
          offsetAnchor: "50% 50%",
          offsetRotate: "0deg",
        } as CSSProperties;
        return <div key={imp.id} className="neural-impulse" style={style} />;
      })}
      {flashes.map((f) => {
        const color = NEURAL_PRIORITY_COLORS[f.priority];
        const rgb = NEURAL_PRIORITY_RGB[f.priority];
        return (
          <div
            key={f.id}
            className="neural-ring-flash"
            style={{
              position: "absolute",
              left: FLASH_LEFT,
              top: FLASH_TOP,
              width: FLASH_SIZE,
              height: FLASH_SIZE,
              borderRadius: "50%",
              border: `${FLASH_BORDER}px solid ${color}`,
              boxShadow: `0 0 ${scale(18)}px ${color}, inset 0 0 ${scale(18)}px rgba(${rgb},.5)`,
            }}
          />
        );
      })}
    </div>
  );
}
