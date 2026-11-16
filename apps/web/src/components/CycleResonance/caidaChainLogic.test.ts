import { describe, expect, it } from "vitest";
import type { LogStatus } from "../../domain";
import { computeCaidaChains } from "./caidaChainLogic";
import { computeSynergies, type SynergyRawHabit } from "./sinergiasLogic";

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
  return { id, name: id, area: "fis", percent: 50, strengthKey: "sendero", createdAt: "2026-01-01", activeWeekdays: null, ...overrides };
}

function statusOfFrom(map: Record<string, Record<string, LogStatus>>): (habitId: string, date: string) => LogStatus {
  return (habitId, date) => map[habitId]?.[date] ?? "PENDING";
}

describe("computeCaidaChains — detección de cadenas", () => {
  const d = days(10);
  // 3 hábitos que fallan juntos los mismos 5 días (0,1,2,3,4) y se cumplen
  // los otros 5 — co-fallas muy por encima de lo esperable por azar.
  const failDays = new Set([0, 1, 2, 3, 4]);
  const h1 = habit("h1");
  const h2 = habit("h2");
  const h3 = habit("h3");
  const statusOf = statusOfFrom({
    h1: Object.fromEntries(d.map((date, i) => [date, failDays.has(i) ? "PENDING" : "DONE"])),
    h2: Object.fromEntries(d.map((date, i) => [date, failDays.has(i) ? "PENDING" : "DONE"])),
    h3: Object.fromEntries(d.map((date, i) => [date, failDays.has(i) ? "PENDING" : "DONE"])),
  });

  it("agrupa 3 hábitos que caen juntos en una sola cadena", () => {
    const chains = computeCaidaChains([h1, h2, h3], d, statusOf, new Map(), []);
    expect(chains).toHaveLength(1);
    expect(chains[0].habitIds.sort()).toEqual(["h1", "h2", "h3"]);
    expect(chains[0].coFailureDays).toBe(5);
    expect(chains[0].sharedDays).toBe(10);
    expect(chains[0].summary).toBe("Estos 3 hábitos suelen caer el mismo día");
  });

  it("un par que no llega a 3 miembros no tiene ancla (solo tiene sentido con 3+)", () => {
    const h4 = habit("h4");
    const statusOfPair = statusOfFrom({
      h1: Object.fromEntries(d.map((date, i) => [date, failDays.has(i) ? "PENDING" : "DONE"])),
      h4: Object.fromEntries(d.map((date, i) => [date, failDays.has(i) ? "PENDING" : "DONE"])),
    });
    const chains = computeCaidaChains([h1, h4], d, statusOfPair, new Map(), []);
    expect(chains).toHaveLength(1);
    expect(chains[0].habitIds).toHaveLength(2);
    expect(chains[0].anchorId).toBeNull();
  });

  it("sin pares que co-fallen lo suficiente, no hay cadenas", () => {
    const independent = statusOfFrom({
      h1: Object.fromEntries(d.map((date, i) => [date, i % 2 === 0 ? "DONE" : "PENDING"])),
      h2: Object.fromEntries(d.map((date, i) => [date, i % 2 === 1 ? "DONE" : "PENDING"])),
    });
    expect(computeCaidaChains([h1, h2], d, independent, new Map(), [])).toEqual([]);
  });
});

describe("computeCaidaChains — ancla UNIFICADA con Sinergias (mismo módulo, nunca dos recomendaciones distintas)", () => {
  const d = days(10);
  const failDays = new Set([0, 1, 2, 3, 4]);
  // h1/h2/h3 caen juntos (cadena de 3). Para desempatar el "diff" entre
  // ellos de forma clara, construimos los nodos de Sinergias A MANO en vez
  // de recalcularlos — lo único que importa acá es la REGLA de selección,
  // no si el diff en sí está bien calculado (eso ya lo prueba
  // sinergiasLogic.test.ts).
  const statusOf = statusOfFrom({
    h1: Object.fromEntries(d.map((date, i) => [date, failDays.has(i) ? "PENDING" : "DONE"])),
    h2: Object.fromEntries(d.map((date, i) => [date, failDays.has(i) ? "PENDING" : "DONE"])),
    h3: Object.fromEntries(d.map((date, i) => [date, failDays.has(i) ? "PENDING" : "DONE"])),
  });

  function node(id: string, diff: number | null) {
    return { id, name: id, area: "fis" as const, percent: 50, diff, withOthers: null, withoutOthers: null, isAnchor: false, isHiddenAnchor: false, message: "" };
  }

  it("si un miembro YA es ancla global de Sinergias, se recomienda ESE aunque otro tenga diff local más alto", () => {
    // h3 tiene el diff más alto de los tres (20), pero h1 es el ancla
    // GLOBAL de Sinergias (vino en `synergyAnchorIds`) — debe ganar h1, no h3.
    const synergyNodesById = new Map([
      ["h1", node("h1", 8)],
      ["h2", node("h2", 5)],
      ["h3", node("h3", 20)],
    ]);
    const chains = computeCaidaChains([habit("h1"), habit("h2"), habit("h3")], d, statusOf, synergyNodesById, ["h1"]);
    expect(chains[0].anchorId).toBe("h1");
  });

  it("si ningún miembro es ancla global, cae al de mayor diff propio entre los miembros", () => {
    const synergyNodesById = new Map([
      ["h1", node("h1", 8)],
      ["h2", node("h2", 5)],
      ["h3", node("h3", 20)],
    ]);
    // "otroHabito" es el ancla global pero no es parte de esta cadena.
    const chains = computeCaidaChains([habit("h1"), habit("h2"), habit("h3")], d, statusOf, synergyNodesById, ["otroHabito"]);
    expect(chains[0].anchorId).toBe("h3");
  });

  it("si ningún miembro tiene diff calculado por Sinergias, no inventa un ancla", () => {
    const chains = computeCaidaChains([habit("h1"), habit("h2"), habit("h3")], d, statusOf, new Map(), []);
    expect(chains[0].anchorId).toBeNull();
  });

  it("consistencia de punta a punta: computeSynergies + computeCaidaChains sobre el MISMO ciclo nunca recomiendan dos hábitos distintos para el mismo caso", () => {
    const habits = [habit("h1"), habit("h2"), habit("h3")];
    const synergyResult = computeSynergies(habits, d, statusOf);
    const synergyNodesById = new Map(synergyResult.nodes.map((n) => [n.id, n]));
    const chains = computeCaidaChains(habits, d, statusOf, synergyNodesById, synergyResult.anchorIds);

    if (chains[0]?.anchorId && synergyResult.anchorIds.length > 0) {
      const chainMembersThatAreGlobalAnchors = chains[0].habitIds.filter((id) => synergyResult.anchorIds.includes(id));
      if (chainMembersThatAreGlobalAnchors.length > 0) {
        // Si la cadena incluye a algún ancla global, la cadena DEBE recomendar
        // precisamente a esa (la de mejor ranking global entre las presentes).
        const bestGlobal = synergyResult.anchorIds.find((id) => chainMembersThatAreGlobalAnchors.includes(id));
        expect(chains[0].anchorId).toBe(bestGlobal);
      }
    }
  });
});
