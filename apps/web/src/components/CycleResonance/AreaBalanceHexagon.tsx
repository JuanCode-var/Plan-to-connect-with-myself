import { BRAIN_AREA_COLOR, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_LAVENDER } from "../NeuralCore/tokens";
import type { ResonanceArea } from "./useCycleResonance";

// Orden pedido explícito (no es BRAIN_AREAS canónico): Mental, Espiritual,
// Emocional, Económica, Habilidades, Física — mismo orden del mockup.
const HEX_ORDER: BrainArea[] = ["men", "esp", "emo", "eco", "hab", "fis"];

const CX = 150;
const CY = 150;
const R = 95;
const RL = 124;
const RING_FRACTIONS = [0.25, 0.5, 0.75, 1];
// Viewbox más grande que el hexágono (150±124) para dejarle lugar a las
// etiquetas — ver nota en el componente sobre por qué viven DENTRO del SVG.
const VIEWBOX = "-20 0 340 320";

function vertex(i: number, r: number): [number, number] {
  const a = (Math.PI / 180) * (-90 + i * 60);
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function fmt([x, y]: [number, number]): string {
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

/**
 * "Equilibrio de áreas" — hexágono de radio 95 con 4 anillos guía, puerto
 * directo de la geometría del mockup. Las etiquetas (nombre + %) viven
 * DENTRO del SVG como `<text>`, no como `<div>`s posicionados aparte con
 * `left/top` en píxeles: así todo el bloque escala junto cuando el SVG se
 * dibuja más chico en una pantalla angosta (ancho fluido, `viewBox` fijo —
 * el truco nativo de SVG para esto) en vez de quedar el texto en su
 * posición de 300px mientras el hexágono se encoge por su cuenta.
 *
 * Si un área tiene 0% (sin hábitos todavía), su punta queda casi en el
 * centro (mismo truco que el mockup: `Math.max(fracción, 0.02)` para que el
 * polígono no colapse a un punto) y se marca con un circulito punteado en
 * SU PROPIO vértice — generalizado acá para cualquier combinación de áreas
 * vacías, no solo una fija.
 */
export function AreaBalanceHexagon({ byArea }: { byArea: ResonanceArea[] }) {
  const ordered = HEX_ORDER.map((area) => ({ area, entry: byArea.find((a) => a.area === area)! }));

  const axesPath = ordered.map((_, i) => `M${CX} ${CY} L${fmt(vertex(i, R))}`).join(" ");
  const valuePolygon = ordered.map(({ entry }, i) => fmt(vertex(i, R * Math.max((entry.percent ?? 0) / 100, 0.02)))).join(" ");

  return (
    <div className="mx-auto w-full" style={{ maxWidth: 300 }}>
      <span
        className="block text-center"
        style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}
      >
        EQUILIBRIO DE ÁREAS
      </span>
      <svg
        role="img"
        aria-label="Hexágono de equilibrio de las 6 áreas"
        width="100%"
        viewBox={VIEWBOX}
        style={{ display: "block", marginTop: 12 }}
      >
        <g fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={1}>
          {RING_FRACTIONS.map((f) => (
            <polygon key={f} points={ordered.map((_, i) => fmt(vertex(i, R * f))).join(" ")} />
          ))}
          <path d={axesPath} />
        </g>
        <polygon
          points={valuePolygon}
          fill="rgba(34,211,238,0.18)"
          stroke="#22D3EE"
          strokeWidth={2}
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 10px rgba(34,211,238,0.6))" }}
        />
        {ordered.map(({ area, entry }, i) => {
          if (entry.percent !== null) return null;
          const [x, y] = vertex(i, R * 0.02);
          return (
            <circle key={area} cx={x} cy={y} r={5} fill="none" stroke={BRAIN_AREA_COLOR[area]} strokeWidth={2} strokeDasharray="3 2" />
          );
        })}
        {ordered.map(({ area, entry }, i) => {
          const [x, y] = vertex(i, RL);
          return (
            <g key={area}>
              <text x={x} y={y + 28} textAnchor="middle" fontFamily={NEURAL_FONT_BODY} fontSize={12} fontWeight={600} fill={BRAIN_AREA_COLOR[area]}>
                {entry.label}
              </text>
              <text x={x} y={y + 47} textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontSize={16} fontWeight={700} fill="#FFFFFF">
                {entry.percent !== null ? `${entry.percent}%` : "—"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
