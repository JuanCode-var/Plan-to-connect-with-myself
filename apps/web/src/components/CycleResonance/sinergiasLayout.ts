import { mulberry32 } from "../NeuralCore/starField";
import { RING_ORDER } from "./conexionesTokens";
import { synergyNodeSize } from "./sinergiasLogic";
import type { BrainArea } from "../NeuralCore/brainTokens";

/**
 * Posiciones de la red de "Sinergias" — agrupadas por área (angularmente,
 * mismo lenguaje visual que el mapa de conexiones, RING_ORDER reutilizado
 * tal cual) y después relajadas con una simulación de fuerzas CORTA Y
 * DETERMINISTA: semilla fija (`LAYOUT_SEED`), cantidad fija de iteraciones,
 * nada de `Math.random()` ni de tiempo real. Con el mismo conjunto de
 * hábitos y enlaces, siempre da las mismas posiciones — "no deben cambiar
 * entre visitas" (pedido explícito).
 */
export const NET_W = 880;
export const NET_H = 600;
export const NET_CX = NET_W / 2;
export const NET_CY = NET_H / 2;

const LAYOUT_SEED = 90125;
const MARGIN = 80;
const ITERATIONS = 260;
const REPULSION = 5200;
const SPRING = 0.02;
const IDEAL_LINK_DIST = 150;
const DAMPING = 0.82;
// Separación mínima GARANTIZADA entre dos nodos, al final de la relajación
// de fuerzas: con muchos hábitos enlazados entre sí, el equilibrio de
// fuerzas puede converger con un grupo todavía encimado (visto en captura
// real: 3-4 nodos literalmente superpuestos, algunos de ~100px de diámetro
// por tener diff alto) — esta segunda pasada, pura separación sin resortes,
// lo corrige siempre, sin depender de qué tan bien convergió la simulación
// de arriba. A diferencia de antes, la separación exigida entre un PAR ya no
// es una constante: es la suma de los RADIOS reales de esos dos nodos (ver
// synergyNodeSize en sinergiasLogic.ts) más este margen fijo para que
// quede lugar para sus etiquetas — dos nodos grandes necesitan más espacio
// entre sí que dos chicos.
const SEPARATION_PADDING = 26;
const SEPARATION_PASSES = 160;

export type SynergyLayoutInput = { id: string; area: BrainArea; diff: number | null };
export type SynergyLayoutLink = { a: string; b: string; score: number };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function layoutSynergyNetwork(nodes: SynergyLayoutInput[], links: SynergyLayoutLink[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return positions;

  const radiusById = new Map(nodes.map((n) => [n.id, synergyNodeSize(n.diff) / 2]));
  function minSeparationFor(idA: string, idB: string): number {
    return radiusById.get(idA)! + radiusById.get(idB)! + SEPARATION_PADDING;
  }

  const rng = mulberry32(LAYOUT_SEED);

  // 1. Posición inicial: sectores angulares por área (RING_ORDER, orden
  // estable), radio dentro de una elipse ajustada al aspecto 880×600 — el
  // mismo truco de "sector proporcional a la cantidad" que conexionesLayout.ts.
  const areasPresent = RING_ORDER.filter((area) => nodes.some((n) => n.area === area));
  const total = nodes.length;
  const slot = (Math.PI * 2) / total;
  const rx = NET_W / 2 - MARGIN - 40;
  const ry = NET_H / 2 - MARGIN - 40;

  let angleCursor = -Math.PI / 2;
  for (const area of areasPresent) {
    const inArea = nodes.filter((n) => n.area === area);
    inArea.forEach((n, i) => {
      const ang = angleCursor + (i + 0.5) * slot;
      const radiusFrac = 0.45 + rng() * 0.5;
      positions.set(n.id, { x: NET_CX + rx * radiusFrac * Math.cos(ang), y: NET_CY + ry * radiusFrac * Math.sin(ang) });
    });
    angleCursor += inArea.length * slot;
  }

  // 2. Relajación: repulsión entre todos los pares (para que no se encimen)
  // + atracción de los enlaces hacia un largo ideal, proporcional a su
  // fuerza (`score`) — cantidad de iteraciones y constantes fijas, nunca
  // dependientes de cuánto tarda en "converger": siempre el mismo resultado.
  const velocities = new Map(nodes.map((n) => [n.id, { vx: 0, vy: 0 }]));

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const forces = new Map(nodes.map((n) => [n.id, { fx: 0, fy: 0 }]));

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const idA = nodes[i].id;
        const idB = nodes[j].id;
        const A = positions.get(idA)!;
        const B = positions.get(idB)!;
        const dx = A.x - B.x;
        const dy = A.y - B.y;
        const distSq = Math.max(1, dx * dx + dy * dy);
        const dist = Math.sqrt(distSq);
        // Nodos grandes (diff alto) se repelen con más fuerza — sin esto, un
        // par de nodos grandes converge a la MISMA distancia de equilibrio
        // que un par chico, que no les alcanza para no superponerse.
        const sizeFactor = (radiusById.get(idA)! + radiusById.get(idB)!) / 40;
        const force = (REPULSION * Math.max(1, sizeFactor)) / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        forces.get(idA)!.fx += fx;
        forces.get(idA)!.fy += fy;
        forces.get(idB)!.fx -= fx;
        forces.get(idB)!.fy -= fy;
      }
    }

    for (const link of links) {
      const A = positions.get(link.a);
      const B = positions.get(link.b);
      if (!A || !B) continue;
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const stretch = dist - IDEAL_LINK_DIST;
      const force = stretch * SPRING * (0.5 + link.score);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      forces.get(link.a)!.fx += fx;
      forces.get(link.a)!.fy += fy;
      forces.get(link.b)!.fx -= fx;
      forces.get(link.b)!.fy -= fy;
    }

    for (const n of nodes) {
      const v = velocities.get(n.id)!;
      const f = forces.get(n.id)!;
      v.vx = (v.vx + f.fx) * DAMPING;
      v.vy = (v.vy + f.fy) * DAMPING;
      const p = positions.get(n.id)!;
      p.x = clamp(p.x + v.vx, MARGIN, NET_W - MARGIN);
      p.y = clamp(p.y + v.vy, MARGIN, NET_H - MARGIN);
    }
  }

  // 3. Pasada de separación dura: a diferencia de la repulsión de arriba
  // (que compite contra los enlaces y puede quedar en equilibrio con dos
  // nodos todavía cerca), esta solo empuja — nada tira de vuelta — así que
  // SIEMPRE termina con todos los pares a `minSeparationFor(a,b)` o más
  // (la suma de sus radios REALES, no una constante — ver comentario de
  // SEPARATION_PADDING arriba), sin excepción. Orden de iteración estable
  // (mismo `nodes`/`links` de siempre) + nada de azar → el resultado sigue
  // siendo determinista.
  for (let pass = 0; pass < SEPARATION_PASSES; pass++) {
    let movedAny = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const idA = nodes[i].id;
        const idB = nodes[j].id;
        const minSep = minSeparationFor(idA, idB);
        const A = positions.get(idA)!;
        const B = positions.get(idB)!;
        let dx = A.x - B.x;
        let dy = A.y - B.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= minSep) continue;
        movedAny = true;
        if (dist < 0.001) {
          // Coincidentes de verdad (rarísimo): separarlos en una dirección
          // fija derivada del índice del par, no al azar, para que el
          // resultado siga sin depender de nada más que los datos.
          const ang = ((i * 97 + j * 131) % 360) * (Math.PI / 180);
          dx = Math.cos(ang);
          dy = Math.sin(ang);
          dist = 1;
        }
        const push = (minSep - dist) / 2;
        const ux = dx / dist;
        const uy = dy / dist;
        A.x = clamp(A.x + ux * push, MARGIN, NET_W - MARGIN);
        A.y = clamp(A.y + uy * push, MARGIN, NET_H - MARGIN);
        B.x = clamp(B.x - ux * push, MARGIN, NET_W - MARGIN);
        B.y = clamp(B.y - uy * push, MARGIN, NET_H - MARGIN);
      }
    }
    if (!movedAny) break;
  }

  return positions;
}
