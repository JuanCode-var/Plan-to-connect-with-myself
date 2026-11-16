import { describe, expect, it } from "vitest";
import { matchesExistingCounter, suggestCommitmentArea } from "./commitmentArea";

describe("suggestCommitmentArea", () => {
  it("ahorrar -> Económica", () => {
    expect(suggestCommitmentArea("Ahorrar 20% de mi sueldo", "")).toBe("ECONOMICO");
  });
  it("alcohol -> Emocional", () => {
    expect(suggestCommitmentArea("Dejar el alcohol", "")).toBe("EMOCIONAL");
  });
  it("sin coincidencia -> null", () => {
    expect(suggestCommitmentArea("Ser mejor persona", "")).toBeNull();
  });
});

describe("matchesExistingCounter", () => {
  it("detecta el compromiso de no beber como el contador de alcohol", () => {
    expect(matchesExistingCounter("No beber más", "")).toBe("alcohol");
  });
  it("detecta el compromiso de apuestas", () => {
    expect(matchesExistingCounter("Dejar de apostar", "")).toBe("apuestas");
  });
  it("sin coincidencia -> null", () => {
    expect(matchesExistingCounter("Leer más libros", "")).toBeNull();
  });
});
