import { describe, expect, it } from "vitest";
import { pickDailyQuote, selectBookForYou, type BookCandidate } from "./forYouSelectors";

describe("selectBookForYou", () => {
  const books: BookCandidate[] = [
    { id: "b1", area: "fis", status: "NUEVO" },
    { id: "b2", area: "fis", status: "LEIDO" },
    { id: "b3", area: "men", status: "NUEVO" },
  ];

  it("elige el área con menor % entre las que tienen libros", () => {
    const result = selectBookForYou({ fis: 10, men: 90 }, books);
    expect(result?.area).toBe("fis");
  });

  it("ignora un área con % más bajo si no tiene ningún libro", () => {
    const result = selectBookForYou({ eco: 1, fis: 50, men: 90 }, books); // "eco" no tiene libros
    expect(result?.area).not.toBe("eco");
    expect(result?.area).toBe("fis");
  });

  it("dentro del área elegida, prefiere un libro todavía no leído", () => {
    const result = selectBookForYou({ fis: 10, men: 90 }, books);
    expect(result?.bookId).toBe("b1"); // no "b2", que ya está LEIDO
  });

  it("si todos los libros del área ya están leídos, igual elige uno (no deja el área sin recomendación)", () => {
    const allRead: BookCandidate[] = [{ id: "b1", area: "fis", status: "LEIDO" }];
    const result = selectBookForYou({ fis: 10 }, allRead);
    expect(result?.bookId).toBe("b1");
  });

  it("sin ningún libro con área asignada, devuelve null", () => {
    expect(selectBookForYou({ fis: 10 }, [{ id: "b1", area: null, status: "NUEVO" }])).toBeNull();
  });
});

describe("pickDailyQuote", () => {
  const quotes = [{ id: "q1" }, { id: "q2" }, { id: "q3" }];

  it("es estable durante el mismo día", () => {
    const a = pickDailyQuote(quotes, "2026-01-01");
    const b = pickDailyQuote(quotes, "2026-01-01");
    expect(a).toEqual(b);
  });

  it("cambia en fechas distintas (al menos para alguna de un rango razonable)", () => {
    const picks = new Set(Array.from({ length: 10 }, (_, i) => pickDailyQuote(quotes, `2026-01-${String(i + 1).padStart(2, "0")}`)?.id));
    expect(picks.size).toBeGreaterThan(1);
  });

  it("sin frases, devuelve null", () => {
    expect(pickDailyQuote([], "2026-01-01")).toBeNull();
  });
});
