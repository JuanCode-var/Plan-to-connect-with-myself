import { describe, expect, it } from "vitest";
import { synergyNodeSize } from "./sinergiasLogic";
import { layoutSynergyNetwork, NET_H, NET_W } from "./sinergiasLayout";

const NODES = [
  { id: "a", area: "men" as const, diff: 10 },
  { id: "b", area: "men" as const, diff: 20 },
  { id: "c", area: "fis" as const, diff: 15 },
  { id: "d", area: "emo" as const, diff: null },
  { id: "e", area: "esp" as const, diff: 5 },
];
const LINKS = [
  { a: "a", b: "b", score: 0.8 },
  { a: "a", b: "c", score: 0.6 },
  { a: "d", b: "e", score: 0.55 },
];

const SEPARATION_PADDING = 26;

function expectedMinSeparation(a: { diff: number | null }, b: { diff: number | null }): number {
  return synergyNodeSize(a.diff) / 2 + synergyNodeSize(b.diff) / 2 + SEPARATION_PADDING;
}

function assertNoOverlap(nodes: Array<{ id: string; diff: number | null }>, positions: Map<string, { x: number; y: number }>) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const A = positions.get(nodes[i].id)!;
      const B = positions.get(nodes[j].id)!;
      const dist = Math.hypot(A.x - B.x, A.y - B.y);
      expect(dist).toBeGreaterThanOrEqual(expectedMinSeparation(nodes[i], nodes[j]) - 0.5); // tolerancia de punto flotante
    }
  }
}

describe("layoutSynergyNetwork", () => {
  it("es determinista: mismos nodos/enlaces -> siempre las mismas posiciones", () => {
    const first = layoutSynergyNetwork(NODES, LINKS);
    const second = layoutSynergyNetwork(NODES, LINKS);
    for (const n of NODES) {
      expect(second.get(n.id)).toEqual(first.get(n.id));
    }
  });

  it("todas las posiciones quedan dentro del área 880x600", () => {
    const positions = layoutSynergyNetwork(NODES, LINKS);
    for (const n of NODES) {
      const p = positions.get(n.id)!;
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(NET_W);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(NET_H);
    }
  });

  it("no todos los nodos colapsan en el mismo punto", () => {
    const positions = layoutSynergyNetwork(NODES, LINKS);
    const xs = new Set(NODES.map((n) => Math.round(positions.get(n.id)!.x)));
    expect(xs.size).toBeGreaterThan(1);
  });

  it("sin nodos, devuelve un mapa vacío sin romper", () => {
    expect(layoutSynergyNetwork([], []).size).toBe(0);
  });
});

describe("layoutSynergyNetwork — sin nodos superpuestos (bug real: un grupo muy enlazado quedaba encimado)", () => {
  // 18 hábitos con un grupito de 5 fuertemente interconectados entre sí
  // (como el "Desayunar/Full enfoque/Cero alcohol/Sacar a los perros" de la
  // captura real que llegó superpuesto) — reproduce el caso que de verdad
  // falló antes de agregar la pasada de separación dura.
  const areas = ["men", "esp", "emo", "eco", "fis", "hab"] as const;
  const nodes = Array.from({ length: 18 }, (_, i) => ({ id: `n${i}`, area: areas[i % areas.length], diff: 10 + (i % 5) * 8 }));
  const clique = ["n0", "n1", "n2", "n3", "n4"];
  const links: Array<{ a: string; b: string; score: number }> = [];
  for (let i = 0; i < clique.length; i++) {
    for (let j = i + 1; j < clique.length; j++) {
      links.push({ a: clique[i], b: clique[j], score: 0.75 });
    }
  }

  it("ningún par de nodos queda más cerca que la suma de sus radios + el margen de etiqueta", () => {
    const positions = layoutSynergyNetwork(nodes, links);
    assertNoOverlap(nodes, positions);
  });
});

describe("layoutSynergyNetwork — nodos grandes (diff alto, ~100px de diámetro) no se superponen", () => {
  // Reproduce EXACTO el bug de la captura real: varios hábitos con diff muy
  // alto (70-90, dando nodos de ~95-115px de diámetro) todos enlazados entre
  // sí — con una separación mínima FIJA (el bug original) estos quedaban
  // uno encima del otro porque 78px no alcanza ni cerca para dos círculos de
  // 100px de diámetro cada uno.
  const nodes = [
    { id: "big1", area: "fis" as const, diff: 90 },
    { id: "big2", area: "emo" as const, diff: 85 },
    { id: "big3", area: "hab" as const, diff: 77 },
    { id: "big4", area: "men" as const, diff: 70 },
  ];
  const links = [
    { a: "big1", b: "big2", score: 0.9 },
    { a: "big1", b: "big3", score: 0.85 },
    { a: "big1", b: "big4", score: 0.8 },
    { a: "big2", b: "big3", score: 0.75 },
  ];

  it("se respeta la separación mínima incluso entre los nodos más grandes posibles", () => {
    const positions = layoutSynergyNetwork(nodes, links);
    assertNoOverlap(nodes, positions);
  });
});
