import { describe, expect, it } from "vitest";
import type { ResonanceArea } from "./useCycleResonance";
import {
  areaFillOpacity,
  futureAreaPercents,
  goalForArea,
  identityGrowthArea,
  isAreaDashed,
  overallDelta,
  projectedClose,
} from "./versionesLogic";

/** Atajo para armar un `ResonanceArea[]` de prueba a partir de un record parcial (las áreas omitidas quedan en `null`, "sin hábitos"). */
function areas(partial: Partial<Record<"men" | "esp" | "emo" | "eco" | "fis" | "hab", number>>): ResonanceArea[] {
  const all = ["men", "esp", "emo", "eco", "fis", "hab"] as const;
  return all.map((area) => ({ area, label: area, percent: partial[area] ?? null, habitCount: partial[area] != null ? 1 : 0 }));
}

describe("identityGrowthArea — 1 solo ciclo (sin ciclo anterior)", () => {
  it("usa la 'autopista del ciclo' (el área más fuerte) cuando no hay ciclo anterior con qué comparar", () => {
    const now = areas({ men: 80, hab: 59, emo: 90, fis: 53, esp: 87 }); // eco: sin hábitos
    expect(identityGrowthArea(now, null)).toBe("emo");
  });

  it("ignora un área sin hábitos (percent null) aunque sea la de mayor valor por default", () => {
    const now = areas({ men: 10 }); // eco/emo/fis/esp/hab: sin hábitos
    expect(identityGrowthArea(now, null)).toBe("men");
  });

  it("devuelve null si el ciclo todavía no tiene ningún hábito en ninguna área", () => {
    expect(identityGrowthArea(areas({}), null)).toBeNull();
  });
});

describe("identityGrowthArea — 3 ciclos simulados (con historial real)", () => {
  // Misma progresión que Versiones.dc.html (convertida a 0-100), pero el
  // punto de la prueba es confirmar que SE CALCULA de los datos reales, no
  // que se copian las frases fijas del mockup.
  const v1 = areas({ men: 50, hab: 35, emo: 60, fis: 30, esp: 55 });
  const v2 = areas({ men: 62, hab: 42, emo: 72, fis: 38, esp: 68 });
  const v3 = areas({ men: 72, hab: 50, emo: 84, fis: 46, esp: 80 });

  it("v1 sin ciclo anterior: autopista del ciclo (emo, 60%)", () => {
    expect(identityGrowthArea(v1, null)).toBe("emo");
  });

  it("v2 vs v1: Espiritual creció más (+13, de 55 a 68) aunque no sea la más fuerte", () => {
    expect(identityGrowthArea(v2, v1)).toBe("esp");
  });

  it("v3 vs v2: empate de crecimiento (Emocional y Espiritual, +12 los dos) — gana la primera en orden de BRAIN_AREAS", () => {
    expect(identityGrowthArea(v3, v2)).toBe("emo");
  });

  it("un área nueva (sin hábitos antes, con hábitos ahora) cuenta como crecimiento desde 0, no se excluye", () => {
    const prev = areas({ men: 50 }); // eco sin hábitos todavía
    const cur = areas({ men: 52, eco: 40 }); // eco recién con hábitos
    expect(identityGrowthArea(cur, prev)).toBe("eco");
  });
});

describe("projectedClose", () => {
  it("reproduce el ejemplo numérico de Versiones.dc.html (69% hoy, día 29, promedio 14 días ≈72.14, ciclo de 93 días) ≈ 71%", () => {
    const last14Avg = [74, 70, 67, 79, 71, 79, 81, 77, 67, 77, 61, 54, 83, 70].reduce((a, b) => a + b, 0) / 14;
    expect(projectedClose(69, 29, last14Avg, 93)).toBe(71);
  });

  it("sin días transcurridos todavía, devuelve el % actual sin dividir por cero", () => {
    expect(projectedClose(0, 0, 50, 93)).toBe(0);
  });

  it("cuando ya no quedan días restantes, el cierre proyectado es el % actual", () => {
    expect(projectedClose(80, 93, 50, 93)).toBe(80);
  });
});

describe("goalForArea", () => {
  it("+12 puntos sobre el % actual", () => {
    expect(goalForArea(80)).toBe(92);
  });
  it("topea en 95% aunque +12 lo pasaría", () => {
    expect(goalForArea(90)).toBe(95);
  });
  it("40% inicial cuando el área todavía no tiene hábitos", () => {
    expect(goalForArea(null)).toBe(40);
  });
});

describe("futureAreaPercents (tarjeta 'EN DISEÑO')", () => {
  const now = areas({ men: 80, hab: 59, emo: 90, fis: 53 }); // eco/esp: sin hábitos

  it("el área elegida sube a su meta aspiracional (mínimo 85%, nunca por debajo de lo que ya tiene)", () => {
    expect(futureAreaPercents(now, "fis").fis).toBe(85);
    expect(futureAreaPercents(now, "emo").emo).toBe(90); // ya estaba en 90, no baja a 85
  });

  it("el resto se atenúa al 55% de su valor actual", () => {
    expect(futureAreaPercents(now, "fis").men).toBeCloseTo(44, 5); // 80*0.55
  });

  it("un área sin hábitos que no es la elegida sigue sin hábitos (null), nunca un valor inventado", () => {
    expect(futureAreaPercents(now, "fis").esp).toBeNull();
  });

  it("si el área elegida no tenía hábitos, igual arranca en su meta aspiracional (85%)", () => {
    expect(futureAreaPercents(now, "esp").esp).toBe(85);
  });
});

describe("areaFillOpacity / isAreaDashed", () => {
  it("fórmula .08 + .62×%área", () => {
    expect(areaFillOpacity(80)).toBeCloseTo(0.58, 2);
  });
  it("sin hábitos (null) u 0%: opacidad mínima fija, no la fórmula", () => {
    expect(areaFillOpacity(null)).toBe(0.04);
    expect(areaFillOpacity(0)).toBe(0.04);
  });
  it("tarjeta fantasma (ghost): opacidad casi invisible sin importar el valor", () => {
    expect(areaFillOpacity(90, true)).toBe(0.02);
  });
  it("se dibuja punteada cuando no tiene hábitos o está en 0%", () => {
    expect(isAreaDashed(null)).toBe(true);
    expect(isAreaDashed(0)).toBe(true);
    expect(isAreaDashed(1)).toBe(false);
  });
});

describe("overallDelta (flechas entre tarjetas)", () => {
  it("diferencia redondeada entre dos % generales consecutivos", () => {
    expect(overallDelta(61, 54)).toBe(7);
  });
  it("null si cualquiera de los dos lados no tiene dato real (tarjeta fantasma)", () => {
    expect(overallDelta(61, null)).toBeNull();
    expect(overallDelta(null, 54)).toBeNull();
  });
});
