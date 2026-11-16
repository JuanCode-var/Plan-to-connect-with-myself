import { mulberry32 } from "../NeuralCore/starField";
import { BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, type BrainArea } from "../NeuralCore/brainTokens";

/**
 * Geometría del cerebro holográfico 3D — portada tal cual de Resonancia.dc.html
 * (buildBrain(), la proyección de cámara, las 4 vistas) al stack del
 * proyecto. Esto es geometría procedural DETERMINISTA (semilla fija
 * mulberry32(7)): la nube de 5.000 puntos, las posiciones de ancla de cada
 * etiqueta flotante y los yaw/pitch de cada vista son constantes de diseño,
 * no datos del usuario — se portan exactas. Lo único que SÍ viene del
 * servicio (useCycleResonance, paso 0) es el % de cada área, que entra en
 * tiempo de dibujo (ver HolographicBrain.tsx), nunca acá.
 */

export type BrainRegionKey = BrainArea | "stem";

export type Brain3DPoint = { x: number; y: number; z: number; k: BrainRegionKey };

/** Vector de ancla 3D de la etiqueta flotante de cada región — constante geométrica del mockup, no dato de usuario. */
export const REGION_ANCHOR: Record<BrainArea, [number, number, number]> = {
  men: [-0.74, 0.22, 0.52],
  eco: [0.15, 0.62, 0.42],
  hab: [0.9, 0.08, 0.44],
  emo: [-0.16, -0.46, 0.7],
  fis: [0.74, -0.66, 0.48],
  esp: [-0.08, -0.12, 0.3],
};

/** Orden de aparición de las 6 etiquetas flotantes — igual al mockup (no es BRAIN_AREAS, es el orden propio de esta vista). */
export const BRAIN_LABEL_ORDER: BrainArea[] = ["men", "eco", "hab", "emo", "fis", "esp"];

export type BrainViewKey = "lat" | "sup" | "fro" | "pos";

/** [key, nombre, yaw, pitch] — constantes de cámara del mockup, no datos. */
export const BRAIN_VIEWS: Array<{ key: BrainViewKey; name: string; yaw: number; pitch: number }> = [
  { key: "lat", name: "Lateral", yaw: 0, pitch: 0.15 },
  { key: "sup", name: "Superior", yaw: 0, pitch: 1.25 },
  { key: "fro", name: "Frontal", yaw: -Math.PI / 2, pitch: 0.12 },
  { key: "pos", name: "Posterior", yaw: Math.PI / 2, pitch: 0.12 },
];

/**
 * Nube de ~5.000 puntos del cerebro — puerto directo de `buildBrain()`
 * (mismas constantes, mismo orden de generación, misma asignación de
 * región por punto: x<-0.22 → frontal/Mental, x>0.55 → occipital/
 * Habilidades, si no y>-0.04 → parietal/Económica, si no → temporal/
 * Emocional; más las pasadas aparte de ínsula/Espiritual, cerebelo/Física y
 * tallo). Semilla fija (7): el resultado es idéntico en cada carga, no se
 * recalcula por usuario.
 */
export function buildBrain(): Brain3DPoint[] {
  const rand = mulberry32(7);
  const pts: Brain3DPoint[] = [];
  const dir = (): [number, number, number] => {
    const u = rand() * 2 - 1;
    const t = rand() * Math.PI * 2;
    const q = Math.sqrt(1 - u * u);
    return [q * Math.cos(t), u, q * Math.sin(t)];
  };
  const add = (x: number, y: number, z: number, k: BrainRegionKey) => pts.push({ x, y: y + 0.12, z, k });

  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 1800; i++) {
      const d = dir();
      let x = d[0];
      let y = d[1] * 0.74;
      let z = d[2] * 0.44;
      if (s * z < -0.3 && rand() < 0.75) continue;
      if (y < -0.28) y = -0.28 + (y + 0.28) * 0.45;
      const g = (0.95 + 0.05 * rand()) * (1 + 0.05 * Math.sin(13 * d[0] + 5 * d[2]) * Math.cos(11 * d[1] + 3 * d[0]));
      x *= g;
      y *= g;
      z *= g;
      const k: BrainRegionKey = x < -0.22 ? "men" : x > 0.55 ? "hab" : y > -0.04 ? "eco" : "emo";
      add(x, y, z + s * 0.45, k);
    }
    for (let i = 0; i < 420; i++) {
      const d = dir();
      add(-0.12 + d[0] * 0.52, -0.4 + d[1] * 0.2, s * 0.52 + d[2] * 0.2, "emo");
    }
    for (let i = 0; i < 170; i++) {
      const d = dir();
      const r = Math.cbrt(rand());
      add(-0.08 + d[0] * 0.2 * r, -0.12 + d[1] * 0.12 * r, s * 0.3 + d[2] * 0.07 * r, "esp");
    }
  }
  for (let i = 0; i < 560; i++) {
    const d = dir();
    const st = 1 + 0.06 * Math.sin(55 * d[1]);
    add(0.7 + d[0] * 0.3 * st, -0.6 + d[1] * 0.2, d[2] * 0.56 * st, "fis");
  }
  for (let i = 0; i < 150; i++) {
    const t = rand();
    const a = rand() * Math.PI * 2;
    add(0.42 - t * 0.08 + 0.11 * Math.cos(a), -0.58 - t * 0.5, 0.11 * Math.sin(a), "stem");
  }
  return pts;
}

/**
 * Metadatos por región para el dibujo (color real de BRAIN_AREA_COLOR,
 * nunca un hex suelto — confirmado idéntico al del mockup antes de portar).
 * `rgb` se deriva una sola vez acá (string "r,g,b") para componer
 * `rgba(...)` en cada punto sin reparsear el hex por frame.
 */
function hexToRgb(hex: string): string {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)].join(",");
}

export const BRAIN_REGION_META: Record<BrainRegionKey, { color: string; rgb: string; label: string }> = {
  men: { color: BRAIN_AREA_COLOR.men, rgb: hexToRgb(BRAIN_AREA_COLOR.men), label: BRAIN_AREA_LABEL.men },
  eco: { color: BRAIN_AREA_COLOR.eco, rgb: hexToRgb(BRAIN_AREA_COLOR.eco), label: BRAIN_AREA_LABEL.eco },
  hab: { color: BRAIN_AREA_COLOR.hab, rgb: hexToRgb(BRAIN_AREA_COLOR.hab), label: BRAIN_AREA_LABEL.hab },
  emo: { color: BRAIN_AREA_COLOR.emo, rgb: hexToRgb(BRAIN_AREA_COLOR.emo), label: BRAIN_AREA_LABEL.emo },
  fis: { color: BRAIN_AREA_COLOR.fis, rgb: hexToRgb(BRAIN_AREA_COLOR.fis), label: BRAIN_AREA_LABEL.fis },
  esp: { color: BRAIN_AREA_COLOR.esp, rgb: hexToRgb(BRAIN_AREA_COLOR.esp), label: BRAIN_AREA_LABEL.esp },
  stem: { color: "#64748B", rgb: "100,116,139", label: "" },
};

// Ancho de diseño para el que se calibró la escala 168 del mockup — con
// esto, `makeProjector` reescala la nube de puntos proporcionalmente al
// tamaño REAL del contenedor (que ahora es fluido, no 520px fijo), en vez
// de desbordar un canvas más angosto con objetos dibujados a tamaño fijo.
const DESIGN_WIDTH = 520;
const BASE_SCALE = 168;

/** Proyección de cámara (yaw/pitch, perspectiva simple) — misma distancia que el mockup (4); la escala se deriva de `width` para que el cerebro siempre quepa en su contenedor real. */
export function makeProjector(yaw: number, pitch: number, width: number, height: number) {
  const S = BASE_SCALE * (width / DESIGN_WIDTH);
  const D = 4;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return (x: number, y: number, z: number): [number, number, number] => {
    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;
    const y2 = y * cp - z1 * sp;
    const z3 = y * sp + z1 * cp;
    const f = D / (D - z3);
    return [width / 2 + x1 * S * f, height / 2 + 6 - y2 * S * f, z3];
  };
}
