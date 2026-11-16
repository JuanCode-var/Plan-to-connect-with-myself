import { describe, expect, it } from "vitest";
import { estimateReadingMinutes } from "./readingTime";

describe("estimateReadingMinutes", () => {
  it("texto vacío -> 0 minutos", () => {
    expect(estimateReadingMinutes("")).toBe(0);
    expect(estimateReadingMinutes("   ")).toBe(0);
  });

  it("menos de 200 palabras -> mínimo 1 minuto, nunca 0", () => {
    expect(estimateReadingMinutes("una frase corta")).toBe(1);
  });

  it("~200 palabras/minuto, redondeado", () => {
    const words400 = Array(400).fill("palabra").join(" ");
    expect(estimateReadingMinutes(words400)).toBe(2);
    const words300 = Array(300).fill("palabra").join(" ");
    expect(estimateReadingMinutes(words300)).toBe(2); // 1.5 -> redondea a 2
  });
});
