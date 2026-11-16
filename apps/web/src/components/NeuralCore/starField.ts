import { BRAIN_AREAS, type BrainArea } from "./brainTokens";

export type Star = { x: number; y: number; size: number; duration: number; delay: number };

/** mulberry32 — PRNG determinista y rápido, suficiente para posiciones que no deben cambiar entre visitas (estrellas acá, el punteado del cerebro holográfico en CycleResonance/brainGeometry.ts). */
export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rectángulo (sección 4b del pedido) dentro del cual se reparten las estrellas de cada región; el clip-path de la región recorta las que caen afuera. */
export const AREA_STAR_RECT: Record<BrainArea, { x0: number; y0: number; x1: number; y1: number }> = {
  men: { x0: 50, y0: 30, x1: 300, y1: 300 },
  eco: { x0: 268, y0: 38, x1: 490, y1: 240 },
  hab: { x0: 438, y0: 168, x1: 545, y1: 330 },
  emo: { x0: 160, y0: 210, x1: 470, y1: 340 },
  fis: { x0: 355, y0: 320, x1: 548, y1: 412 },
  esp: { x0: 217, y0: 222, x1: 293, y1: 262 },
};

const MIN_STARS = 6;
// Si un área acumula muchísimos impulsos, el conteo de estrellas se limita
// (sección 4, "si un área supera ~600 puntos, limita los puntos y sube su
// tamaño o brillo") — por encima de este tope no se agregan más divs, solo
// se las deja un poco más grandes/brillantes (ver `sizeBoost` abajo).
const MAX_STARS = 220;
const DENSITY_CAP_IMPULSES = 600;

export function starCountFor(impulsosDeVida: number): number {
  return Math.max(MIN_STARS, Math.min(MAX_STARS, Math.round(impulsosDeVida / 3)));
}

export function buildStars(area: BrainArea, impulsosDeVida: number): Star[] {
  const seed = BRAIN_AREAS.indexOf(area) * 97 + 13;
  const rng = mulberry32(seed);
  const rect = AREA_STAR_RECT[area];
  const count = starCountFor(impulsosDeVida);
  const sizeBoost = impulsosDeVida > DENSITY_CAP_IMPULSES ? 1.4 : 1;

  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rect.x0 + rng() * (rect.x1 - rect.x0),
      y: rect.y0 + rng() * (rect.y1 - rect.y0),
      size: (2 + rng() * 4) * sizeBoost,
      duration: 2 + rng() * 3,
      delay: rng() * 3,
    });
  }
  return stars;
}
