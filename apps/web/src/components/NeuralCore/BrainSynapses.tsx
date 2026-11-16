import { CARD_HEIGHT, CARD_WIDTH, synapsePathD } from "./brainLayout";
import { BRAIN_AREAS, BRAIN_AREA_COLOR, type BrainArea } from "./brainTokens";
import { scale } from "./tokens";

/**
 * Las 6 curvas de sinapsis (sección 3 del pedido), de cada fila de área
 * hacia el centroide de su región — "por debajo del cerebro": esta capa se
 * renderiza ANTES que el cerebro en el DOM (ver CerebroWidget.tsx), así el
 * cerebro la tapa visualmente en el tramo donde se superponen.
 */
export function BrainSynapses({ active }: { active: Record<BrainArea, boolean> }) {
  return (
    <svg
      viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
      width={scale(CARD_WIDTH)}
      height={scale(CARD_HEIGHT)}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    >
      {BRAIN_AREAS.map((area) => {
        const color = BRAIN_AREA_COLOR[area];
        const isActive = active[area];
        return (
          <path
            key={area}
            d={synapsePathD(area)}
            fill="none"
            stroke={color}
            className="neural-synapse"
            style={{ strokeWidth: isActive ? 2.5 : 1.5, strokeOpacity: isActive ? 0.95 : 0.3 }}
          />
        );
      })}
    </svg>
  );
}
