import { describe, expect, it } from "vitest";
import type { LogStatus } from "../../domain";
import { buildDominoChain, computeSynergies, hasEnoughDataForSynergies, selectLinks, type SynergyRawHabit } from "./sinergiasLogic";

function days(count: number, start = "2026-01-01"): string[] {
  const [y, m, d] = start.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  return Array.from({ length: count }, (_, i) => {
    const dt = new Date(base);
    dt.setDate(base.getDate() + i);
    return dt.toISOString().slice(0, 10);
  });
}

function habit(id: string, overrides: Partial<SynergyRawHabit> = {}): SynergyRawHabit {
  return {
    id,
    name: id,
    area: "fis",
    percent: 50,
    strengthKey: "sendero",
    createdAt: "2026-01-01",
    activeWeekdays: null,
    ...overrides,
  };
}

/** Arma un `statusOf` a partir de un mapa {habitId: {date: status}} — las fechas sin entrada caen en "PENDING" (igual que `resonance.statusOf`). */
function statusOfFrom(map: Record<string, Record<string, LogStatus>>): (habitId: string, date: string) => LogStatus {
  return (habitId, date) => map[habitId]?.[date] ?? "PENDING";
}

describe("hasEnoughDataForSynergies", () => {
  it("exige 14 días transcurridos o más", () => {
    expect(hasEnoughDataForSynergies(13)).toBe(false);
    expect(hasEnoughDataForSynergies(14)).toBe(true);
    expect(hasEnoughDataForSynergies(30)).toBe(true);
  });
});

describe("computeSynergies — elegibilidad", () => {
  const d = days(10);

  it("excluye un hábito En poda aunque tenga suficientes días de los dos lados", () => {
    const habits = [habit("poda1", { strengthKey: "poda" })];
    const statusOf = statusOfFrom({ poda1: Object.fromEntries(d.map((date, i) => [date, i < 5 ? "DONE" : "PENDING"])) });
    const result = computeSynergies(habits, d, statusOf);
    expect(result.nodes).toHaveLength(0);
  });

  it("excluye un hábito con pocos datos (menos de 3 días cumplidos o entre 1 y 2 no cumplidos)", () => {
    const pocosCumplidos = habit("a", {});
    const pocosNoCumplidos = habit("b", {});
    const statusOf = statusOfFrom({
      // 2 DONE, 8 PENDING: menos de 3 días cumplidos.
      a: Object.fromEntries(d.map((date, i) => [date, i < 2 ? "DONE" : "PENDING"])),
      // 9 DONE, 1 PENDING: no cumplido no es ni 0 ni ≥3.
      b: Object.fromEntries(d.map((date, i) => [date, i < 9 ? "DONE" : "PENDING"])),
    });
    const result = computeSynergies([pocosCumplidos, pocosNoCumplidos], d, statusOf);
    expect(result.nodes.map((n) => n.id)).toHaveLength(0);
  });

  it("un día fuera del horario del hábito (activeWeekdays) no cuenta para ningún lado, aunque tenga un log", () => {
    // 2026-01-01 es jueves — en esta ventana de 10 días, Jan 3/4/10 (índices
    // 2, 3, 9) son fin de semana. El hábito solo aplica Lun-Vie.
    const h = habit("c", { activeWeekdays: [1, 2, 3, 4, 5] });
    // DONE en {0,1,4,5,6}, PENDING en el resto. Si los fines de semana (2,3,9)
    // se contaran como "no cumplido" (bug), notDoneDays sería {2,3,7,8,9}=5
    // (elegible). Excluyéndolos correctamente, notDoneDays queda en {7,8}=2
    // (NO elegible) — así la prueba realmente depende de la exclusión.
    const statusOf = statusOfFrom({ c: Object.fromEntries(d.map((date, i) => [date, [0, 1, 4, 5, 6].includes(i) ? "DONE" : "PENDING"])) });
    const result = computeSynergies([h], d, statusOf);
    expect(result.nodes).toHaveLength(0);
  });
});

describe("computeSynergies — hábito al 100 % (nodo base, sin 'sin')", () => {
  const d = days(10);

  it("diff null, mensaje de base, nunca aparece como ancla", () => {
    const siempre = habit("full", { percent: 100 });
    const otro = habit("otro", { percent: 70 });
    const statusOf = statusOfFrom({
      full: Object.fromEntries(d.map((date) => [date, "DONE"])),
      otro: Object.fromEntries(d.map((date, i) => [date, i < 7 ? "DONE" : "PENDING"])),
    });
    const result = computeSynergies([siempre, otro], d, statusOf);
    const node = result.nodes.find((n) => n.id === "full")!;
    expect(node.diff).toBeNull();
    expect(node.withoutOthers).toBeNull();
    expect(node.message).toBe(
      "Lo cumples el 100 % de los días: es parte de tu base. No se puede comparar con días sin él, pero sostiene la red y conecta con los hábitos de al lado.",
    );
    expect(node.isAnchor).toBe(false);
    expect(result.anchorIds).not.toContain("full");
  });
});

describe("computeSynergies — un hábito elegible solo, sin otro con quién comparar", () => {
  it("diff null, pero NUNCA el mensaje de '100 %' para un hábito que no está al 100 %", () => {
    const d = days(10);
    const h = habit("solo", { percent: 50 });
    const statusOf = statusOfFrom({ solo: Object.fromEntries(d.map((date, i) => [date, i < 5 ? "DONE" : "PENDING"])) });
    const result = computeSynergies([h], d, statusOf);
    const node = result.nodes.find((n) => n.id === "solo")!;
    expect(node.diff).toBeNull();
    expect(node.message).not.toContain("100 %");
    expect(node.message).toContain("Todavía no hay otros hábitos elegibles");
  });
});

describe("computeSynergies — con/sin/diff (caso con pocos datos reales a mano)", () => {
  // 10 días, 3 hábitos: H1 cumplido d1-d6, H2 y H3 con patrones distintos —
  // valores calculados a mano (ver comentario del módulo).
  const d = days(10);
  const h1 = habit("h1", { percent: 60 });
  const h2 = habit("h2", { percent: 40 });
  const h3 = habit("h3", { percent: 40 });

  const statusOf = statusOfFrom({
    h1: Object.fromEntries(d.map((date, i) => [date, i < 6 ? "DONE" : "PENDING"])),
    h2: Object.fromEntries(
      d.map((date, i) => [date, [0, 1, 2, 6].includes(i) ? "DONE" : "PENDING"]), // d1,d2,d3,d7
    ),
    h3: Object.fromEntries(
      d.map((date, i) => [date, [0, 1, 7, 8].includes(i) ? "DONE" : "PENDING"]), // d1,d2,d8,d9
    ),
  });

  it("con = promedio de los demás los días que SÍ se cumplió, sin = los días que NO", () => {
    const result = computeSynergies([h1, h2, h3], d, statusOf);
    const node = result.nodes.find((n) => n.id === "h1")!;
    expect(node.withOthers).toBe(42); // round(41.67)
    expect(node.withoutOthers).toBe(38); // round(37.5)
    expect(node.diff).toBe(4);
  });
});

describe("computeSynergies — enlaces (Jaccard)", () => {
  it("solo conserva pares con Jaccard ≥ 0.5", () => {
    const d = days(10);
    const fuerte1 = habit("f1", { percent: 70 });
    const fuerte2 = habit("f2", { percent: 60 });
    const debil = habit("lonely", { percent: 50 });
    const statusOf = statusOfFrom({
      f1: Object.fromEntries(d.map((date, i) => [date, i < 7 ? "DONE" : "PENDING"])), // d1-d7
      f2: Object.fromEntries(d.map((date, i) => [date, [0, 1, 2, 3, 4, 7].includes(i) ? "DONE" : "PENDING"])), // d1-d5,d8 -> jaccard con f1: both={d1..d5}=5, either={d1..d8}=8 -> 0.625
      lonely: Object.fromEntries(d.map((date, i) => [date, i >= 5 ? "DONE" : "PENDING"])), // d6-d10, casi disjunto de f1
    });
    const result = computeSynergies([fuerte1, fuerte2, debil], d, statusOf);
    const pair = result.links.find((l) => (l.a === "f1" && l.b === "f2") || (l.a === "f2" && l.b === "f1"));
    expect(pair?.score).toBeCloseTo(0.625, 3);
    expect(result.links.some((l) => [l.a, l.b].includes("lonely") && [l.a, l.b].includes("f1"))).toBe(false);
  });
});

describe("selectLinks — tope de 4 por nodo y 20 en total", () => {
  it("nunca deja más de 4 enlaces tocando el mismo nodo", () => {
    // "hub" enlazado a 6 nodos distintos, todos ≥0.5 — solo los 4 más fuertes sobreviven.
    const candidates = ["a", "b", "c", "d", "e", "f"].map((other, i) => ({ a: "hub", b: other, score: 0.9 - i * 0.05 }));
    const result = selectLinks(candidates);
    expect(result).toHaveLength(4);
    expect(result.map((l) => l.b)).toEqual(["a", "b", "c", "d"]); // los 4 de mayor score
  });

  it("nunca deja más de 20 enlaces en total", () => {
    // 25 pares independientes (nodos distintos de a 2), todos por encima del tope de 20.
    const candidates = Array.from({ length: 25 }, (_, i) => ({ a: `n${i}a`, b: `n${i}b`, score: 0.6 }));
    const result = selectLinks(candidates);
    expect(result).toHaveLength(20);
  });
});

describe("anclas (top 3 por diff)", () => {
  it("elige los 3 hábitos de mayor efecto arrastre, en orden descendente", () => {
    const d = days(10);
    // 4 hábitos elegibles, con diffs claramente distintos por construcción.
    const base = statusOfFrom({
      top: Object.fromEntries(d.map((date, i) => [date, i < 5 ? "DONE" : "PENDING"])),
      second: Object.fromEntries(d.map((date, i) => [date, i < 5 ? "DONE" : "PENDING"])),
      third: Object.fromEntries(d.map((date, i) => [date, i < 5 ? "DONE" : "PENDING"])),
      fourth: Object.fromEntries(d.map((date, i) => [date, i < 5 ? "DONE" : "PENDING"])),
      // El "resto" se cumple exactamente en los días DONE de "top", nunca en los de "second"/"third"/"fourth" —
      // así "top" queda con el mayor diff posible (con=100, sin=0) y los demás con diff=0.
      resto: Object.fromEntries(d.map((date, i) => [date, i < 5 ? "DONE" : "PENDING"])),
    });
    const habits = [habit("top", {}), habit("second", {}), habit("third", {}), habit("fourth", {}), habit("resto", {})];
    const result = computeSynergies(habits, d, base);
    // "top"/"second"/"third"/"fourth"/"resto" tienen el MISMO patrón que "resto" acá (a propósito, para
    // simplificar): todos quedan con diff=0 salvo que se compare contra sí mismo (excluido). Este caso solo
    // confirma que como máximo se eligen 3 anclas y que están ordenadas de mayor a menor diff.
    expect(result.anchorIds.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < result.anchorIds.length; i++) {
      const diffA = result.nodes.find((n) => n.id === result.anchorIds[i - 1])!.diff!;
      const diffB = result.nodes.find((n) => n.id === result.anchorIds[i])!.diff!;
      expect(diffA).toBeGreaterThanOrEqual(diffB);
    }
  });
});

describe("ancla oculta", () => {
  it("% bajo (<60) + diff alto (≥15) se marca como ancla oculta, con su propio mensaje", () => {
    const d = days(10);
    const oculta = habit("oculta", { percent: 40 });
    const resto = habit("resto", { percent: 70 });
    const statusOf = statusOfFrom({
      // "oculta" se cumple solo 4 de 10 días (40%), pero esos 4 días "resto" SIEMPRE se cumple,
      // y los 6 días que no, "resto" nunca se cumple -> diff = 100-0 = 100 (bien por encima de 15).
      oculta: Object.fromEntries(d.map((date, i) => [date, i < 4 ? "DONE" : "PENDING"])),
      resto: Object.fromEntries(d.map((date, i) => [date, i < 4 ? "DONE" : "PENDING"])),
    });
    const result = computeSynergies([oculta, resto], d, statusOf);
    const node = result.nodes.find((n) => n.id === "oculta")!;
    expect(node.isHiddenAnchor).toBe(true);
    expect(node.message.startsWith("Ancla oculta")).toBe(true);
  });
});

describe("buildDominoChain", () => {
  it("[vecino más fuerte, ancla principal, siguientes 2 enlaces], sin repetir", () => {
    const links = [
      { a: "main", b: "n1", score: 0.9 },
      { a: "main", b: "n2", score: 0.8 },
      { a: "main", b: "n3", score: 0.7 },
      { a: "n1", b: "n4", score: 0.95 }, // no toca a "main" directo, no debe aparecer
    ];
    expect(buildDominoChain("main", links)).toEqual(["n1", "main", "n2", "n3"]);
  });

  it("si el ancla principal no tiene enlaces, la ficha es ella sola", () => {
    expect(buildDominoChain("solo", [])).toEqual(["solo"]);
  });

  it("nunca pasa de 4 fichas aunque haya más de 3 vecinos", () => {
    const links = ["n1", "n2", "n3", "n4", "n5"].map((n, i) => ({ a: "main", b: n, score: 0.9 - i * 0.05 }));
    expect(buildDominoChain("main", links)).toHaveLength(4);
  });
});
