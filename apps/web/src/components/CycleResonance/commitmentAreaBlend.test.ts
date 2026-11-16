import { describe, expect, it } from "vitest";
import { blendCommitmentsIntoAreas } from "./commitmentAreaBlend";

const BASE_AREAS = [
  { area: "men" as const, label: "Mental", percent: 80, habitCount: 3 },
  { area: "eco" as const, label: "Económica", percent: null, habitCount: 0 },
  { area: "fis" as const, label: "Física", percent: 50, habitCount: 2 },
];

describe("blendCommitmentsIntoAreas", () => {
  it("un área sin hábitos deja de estar vacía si hay un compromiso asignado", () => {
    const result = blendCommitmentsIntoAreas(BASE_AREAS, [{ area: "eco", percent: 40 }]);
    const eco = result.find((a) => a.area === "eco")!;
    expect(eco.percent).toBe(40);
    expect(eco.habitCount).toBe(1);
  });

  it("un área con hábitos promedia el compromiso como un dato más (no ponderado)", () => {
    // Mental: 80% con 3 hábitos (suma=240) + compromiso 60% -> (240+60)/4 = 75.
    const result = blendCommitmentsIntoAreas(BASE_AREAS, [{ area: "men", percent: 60 }]);
    const men = result.find((a) => a.area === "men")!;
    expect(men.percent).toBe(75);
    expect(men.habitCount).toBe(4);
  });

  it("un área sin compromisos asignados queda intacta", () => {
    const result = blendCommitmentsIntoAreas(BASE_AREAS, [{ area: "eco", percent: 40 }]);
    const fis = result.find((a) => a.area === "fis")!;
    expect(fis).toEqual(BASE_AREAS[2]);
  });

  it("varios compromisos en la misma área se promedian todos juntos", () => {
    const result = blendCommitmentsIntoAreas(BASE_AREAS, [
      { area: "eco", percent: 20 },
      { area: "eco", percent: 60 },
    ]);
    const eco = result.find((a) => a.area === "eco")!;
    expect(eco.percent).toBe(40); // (20+60)/2
    expect(eco.habitCount).toBe(2);
  });
});
