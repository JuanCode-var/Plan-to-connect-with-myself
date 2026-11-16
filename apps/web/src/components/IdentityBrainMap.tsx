import { BRAIN_LOBE_PATH, BRAIN_REGION_LABEL_POS, INSULA_ELLIPSE } from "./NeuralCore/brainPaths";
import { BRAIN_AREAS, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, CATEGORY_OF_AREA, type BrainArea } from "./NeuralCore/brainTokens";
import type { HabitCategory } from "../domain";
import type { RegionStrength } from "../lib/habitIdentity";

const LOBE_AREAS = BRAIN_AREAS.filter((a) => a !== "esp") as Exclude<BrainArea, "esp">[];
const NEUTRAL_GRAY = "#4B5565";

function labelFor(area: BrainArea, strength: RegionStrength | undefined): string {
  if (!strength || strength.percent === null) return `${BRAIN_AREA_LABEL[area]}: sin hábitos`;
  return `${BRAIN_AREA_LABEL[area]}: ${strength.percent}%`;
}

/**
 * El cerebro de "Hábitos por identidad" (mockups 16e/16h, Paso 2) — mismas
 * formas que brainPaths.ts (BRAIN_LOBE_PATH/INSULA_ELLIPSE, viewBox 0 0 600
 * 480), pero planas y rellenas (no la nube de puntos de ConstellationBrain
 * ni el canvas 3D de HolographicBrain): acá la fuerza se lee de un vistazo
 * en la opacidad del relleno, no hace falta el flourish de esas dos.
 */
export function IdentityBrainMap({
  strengths,
  selected,
  onSelect,
}: {
  strengths: Record<HabitCategory, RegionStrength>;
  selected: BrainArea | null;
  onSelect: (area: BrainArea | null) => void;
}) {
  const ariaLabel = `Cerebro por regiones: ${BRAIN_AREAS.map((a) => labelFor(a, strengths[CATEGORY_OF_AREA[a]])).join(", ")}.`;

  function regionStyle(area: BrainArea) {
    const strength = strengths[CATEGORY_OF_AREA[area]];
    const color = BRAIN_AREA_COLOR[area];
    const isSelected = selected === area;
    const isDimmed = selected !== null && !isSelected;
    const empty = !strength || strength.percent === null;

    const fillOpacity = empty ? 0.04 : 0.1 + (strength!.percent! / 100) * 0.4;
    const strong = !empty && strength!.percent! >= 85;

    return {
      fill: empty ? NEUTRAL_GRAY : color,
      fillOpacity,
      stroke: empty ? NEUTRAL_GRAY : color,
      strokeOpacity: empty ? 0.5 : 1,
      strokeWidth: isSelected ? 2.5 : 1.2,
      strokeDasharray: empty ? "5 4" : undefined,
      opacity: isDimmed ? 0.35 : 1,
      filter: strong ? `drop-shadow(0 0 8px ${color})` : undefined,
      transition: "opacity 300ms ease, stroke-width 200ms ease, filter 300ms ease",
      cursor: "pointer",
    } as React.CSSProperties;
  }

  function toggle(area: BrainArea) {
    onSelect(selected === area ? null : area);
  }

  function handleKeyDown(e: React.KeyboardEvent, area: BrainArea) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(area);
    }
  }

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="relative mx-auto w-full"
      style={{ maxWidth: 420, aspectRatio: "600 / 480" }}
    >
      <style>{`.identity-brain-region:focus-visible { outline: 2px solid #22D3EE; outline-offset: 3px; }`}</style>
      <svg viewBox="0 0 600 480" width="100%" height="100%" aria-hidden="true">
        {LOBE_AREAS.map((area) => {
          const strength = strengths[CATEGORY_OF_AREA[area]];
          return (
            <path
              key={area}
              className="identity-brain-region"
              d={BRAIN_LOBE_PATH[area]}
              style={regionStyle(area)}
              tabIndex={0}
              role="button"
              aria-pressed={selected === area}
              aria-label={labelFor(area, strength)}
              onClick={() => toggle(area)}
              onKeyDown={(e) => handleKeyDown(e, area)}
            />
          );
        })}
        <ellipse
          className="identity-brain-region"
          cx={INSULA_ELLIPSE.cx}
          cy={INSULA_ELLIPSE.cy}
          rx={INSULA_ELLIPSE.rx}
          ry={INSULA_ELLIPSE.ry}
          style={regionStyle("esp")}
          tabIndex={0}
          role="button"
          aria-pressed={selected === "esp"}
          aria-label={labelFor("esp", strengths[CATEGORY_OF_AREA.esp])}
          onClick={() => toggle("esp")}
          onKeyDown={(e) => handleKeyDown(e, "esp")}
        />
        {BRAIN_AREAS.map((area) => {
          const strength = strengths[CATEGORY_OF_AREA[area]];
          const pos = BRAIN_REGION_LABEL_POS[area];
          const isDimmed = selected !== null && selected !== area;
          return (
            <text
              key={`label-${area}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              className="pointer-events-none"
              style={{
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontSize: 20,
                fontWeight: 700,
                fill: "#FFFFFF",
                opacity: isDimmed ? 0.35 : 1,
                transition: "opacity 300ms ease",
              }}
            >
              {strength && strength.percent !== null ? `${strength.percent}%` : "—"}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
