// Geometría del anillo del orbe (sección 3 del pedido). El mockup da ángulos
// fijos para 24 segmentos (slot de 15°, arco 1.6°→13.4° dentro del slot) —
// acá se generaliza a N segmentos reales (un hábito puede dar cualquier
// cantidad, no siempre 24), preservando la misma proporción de hueco entre
// segmentos: ~10.67% del slot a cada lado (1.6/15), arco útil ~78.67% del
// centro del slot.
const ORB_CENTER = 145;
const ORB_RADIUS = 120;
const SLOT_GAP_FRACTION = 1.6 / 15;

function polar(radius: number, angleDeg: number): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: ORB_CENTER + radius * Math.cos(angleRad),
    y: ORB_CENTER + radius * Math.sin(angleRad),
  };
}

/** Path SVG de un segmento i de N sobre el anillo del orbe (radio 120). */
export function orbSegmentPath(index: number, total: number): string {
  const slot = 360 / total;
  const gap = slot * SLOT_GAP_FRACTION;
  const startAngle = -90 + index * slot + gap;
  const endAngle = -90 + (index + 1) * slot - gap;
  const p0 = polar(ORB_RADIUS, startAngle);
  const p1 = polar(ORB_RADIUS, endAngle);
  return `M ${p0.x} ${p0.y} A ${ORB_RADIUS} ${ORB_RADIUS} 0 0 1 ${p1.x} ${p1.y}`;
}
