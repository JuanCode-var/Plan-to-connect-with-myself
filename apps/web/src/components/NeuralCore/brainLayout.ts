import { BRAIN_AREAS, BRAIN_CENTROID, type BrainArea } from "./brainTokens";

// Geometría de diseño (pre-`scale()`) de la tarjeta 1360×820 — fuente única
// para posicionar el cerebro, las 6 filas de área y las curvas de sinapsis
// entre ambos. Las filas usan flujo flex NORMAL (gap fijo), no posición
// absoluta — pero como su alto (ROW_HEIGHT) y separación (ROW_GAP) son
// números fijos, su posición es 100% predecible de antemano: esto es lo que
// permite que BrainSynapses/BrainImpulseLayer calculen el punto de salida de
// cada fila SIN medir el DOM en tiempo real.
export const CARD_WIDTH = 1360;
// 820 (valor literal del pedido) no alcanzaba en la práctica: las celdas
// absolutas no le "avisan" a su contenedor cuánto miden (así funciona
// `position: absolute` en CSS), así que ÚLTIMO EVENTO terminaba saliéndose
// del borde inferior de la tarjeta con texto real (confirmado con captura).
// Se sube a 1020 para darle un presupuesto genuino a ÚLTIMO EVENTO + la
// nota de abajo, sin tocar la posición del cerebro ni de las filas (de las
// que sí dependen las curvas de sinapsis).
export const CARD_HEIGHT = 1020;
export const CARD_PADDING = 36;

export const HEADER_HEIGHT = 150;
export const GAP_HEADER_BRAIN = 24;
export const BRAIN_WIDTH = 600;
export const BRAIN_HEIGHT = 480;
export const BRAIN_OFFSET_Y = HEADER_HEIGHT + GAP_HEADER_BRAIN;

export const GAP_COLUMNS = 56;
export const ROW_LEFT_X = BRAIN_WIDTH + GAP_COLUMNS;
export const ROW_LABEL_HEIGHT = 30;
export const ROW_HEIGHT = 76;
export const ROW_GAP = 10;
// Separación entre la última fila de área y "DATO REAL" — antes estaban
// pegadas, se confundían (pedido explícito, con captura).
export const GAP_ROWS_FACT = 24;

export function rowCenterY(index: number): number {
  return ROW_LABEL_HEIGHT + index * (ROW_HEIGHT + ROW_GAP) + ROW_HEIGHT / 2;
}

/** Centroide de una región, en coordenadas de TARJETA (no del SVG del cerebro). */
export function cardCentroid(area: BrainArea): { x: number; y: number } {
  const c = BRAIN_CENTROID[area];
  return { x: c.x, y: c.y + BRAIN_OFFSET_Y };
}

/**
 * Curva de sinapsis/impulso de la fila `area` hacia el centroide de su
 * región (sección 3 del pedido): "M(filaX, filaY) C(filaX-52, filaY)
 * (cx+150, cy) (cx, cy)".
 */
export function synapsePathD(area: BrainArea): string {
  const index = BRAIN_AREAS.indexOf(area);
  const y = rowCenterY(index);
  const { x: cx, y: cy } = cardCentroid(area);
  return `M${ROW_LEFT_X} ${y} C${ROW_LEFT_X - 52} ${y} ${cx + 150} ${cy} ${cx} ${cy}`;
}
