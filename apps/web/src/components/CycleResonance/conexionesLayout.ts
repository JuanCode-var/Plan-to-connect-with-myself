import type { BrainArea } from "../NeuralCore/brainTokens";
import { HUB_R, MAP_CX, MAP_CY, RING_ORDER, TIER_RADIUS } from "./conexionesTokens";
import type { ResonanceHabit } from "./useCycleResonance";

export type ConexionesHub = {
  area: BrainArea;
  a0: number;
  a1: number;
  mid: number;
  x: number;
  y: number;
  /** Promedio de % de los hábitos reales del área (0 si `n === 0`). */
  avg: number;
  /** Cantidad de hábitos REALES del área (puede ser 0 — sector vacío). */
  n: number;
};

export type ConexionesNode = {
  habit: ResonanceHabit;
  ang: number;
  r: number;
  x: number;
  y: number;
  phase: number;
};

export type ConexionesLayout = {
  hubs: Record<BrainArea, ConexionesHub>;
  nodes: ConexionesNode[];
};

/**
 * Puerto de layout() de Conexiones.dc.html. Un área sin hábitos reales
 * recibe 2 "espacios" vacíos (mismo `|| 2` del mockup) solo para que su
 * sector tenga ancho en el radial — su hub queda con `n: 0` y sin neuronas,
 * así que se dibuja punteado (ver ConexionesMap.tsx), nunca con datos
 * inventados.
 */
export function buildConexionesLayout(byHabit: ResonanceHabit[]): ConexionesLayout {
  const counts = {} as Record<BrainArea, number>;
  for (const area of RING_ORDER) {
    counts[area] = byHabit.filter((h) => h.area === area).length || 2;
  }
  const total = RING_ORDER.reduce((sum, area) => sum + counts[area], 0);
  const slot = (Math.PI * 2) / total;
  // Centra el sector Mental arriba (-90°) — primer área de RING_ORDER, igual que el mockup.
  let a = -Math.PI / 2 - (counts.men * slot) / 2;

  const hubs = {} as Record<BrainArea, ConexionesHub>;
  const nodes: ConexionesNode[] = [];

  for (const area of RING_ORDER) {
    const start = a;
    const span = counts[area] * slot;
    const mid = start + span / 2;
    hubs[area] = {
      area,
      a0: start,
      a1: start + span,
      mid,
      x: MAP_CX + HUB_R * Math.cos(mid),
      y: MAP_CY + HUB_R * Math.sin(mid),
      avg: 0,
      n: 0,
    };

    const inArea = byHabit
      .map((habit, globalIndex) => ({ habit, globalIndex }))
      .filter((o) => o.habit.area === area)
      .sort((x, y) => y.habit.percent - x.habit.percent);

    inArea.forEach(({ habit, globalIndex }, j) => {
      const tierKey = habit.strength.key;
      const ang = start + (j + 0.5) * slot;
      // Alterna ±10 para que las neuronas no se encimen en el mismo anillo —
      // a la mitad (±5) en "automático", que agrupa muchos hábitos muy cerca.
      const spread = (j % 2 ? 10 : -10) * (tierKey === "automatico" ? 0.5 : 1);
      const r = TIER_RADIUS[tierKey] + spread;
      nodes.push({
        habit,
        ang,
        r,
        x: MAP_CX + r * Math.cos(ang),
        y: MAP_CY + r * Math.sin(ang),
        phase: (globalIndex * 0.37) % 1,
      });
      hubs[area].avg += habit.percent;
      hubs[area].n++;
    });

    a += span;
  }

  for (const area of RING_ORDER) {
    const h = hubs[area];
    h.avg = h.n ? Math.round(h.avg / h.n) : 0;
  }

  return { hubs, nodes };
}

export function quad(ax: number, ay: number, cx: number, cy: number, bx: number, by: number, t: number): [number, number] {
  const u = 1 - t;
  return [u * u * ax + 2 * u * t * cx + t * t * bx, u * u * ay + 2 * u * t * cy + t * t * by];
}

/** Punto de control de la dendrita hub→neurona: ángulo mezclado 35/65, radio medio entre hub y neurona. */
export function ctrlFor(hub: ConexionesHub, node: ConexionesNode): [number, number] {
  const ang = hub.mid * 0.35 + node.ang * 0.65;
  const rr = (HUB_R + node.r) * 0.5;
  return [MAP_CX + rr * Math.cos(ang), MAP_CY + rr * Math.sin(ang)];
}
