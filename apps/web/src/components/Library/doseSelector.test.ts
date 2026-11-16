import { describe, expect, it } from "vitest";
import { computeDoseStreak, resolveHookText, selectDailyDose, weekStreakDays, type DoseCandidate } from "./doseSelector";

const DOSES: DoseCandidate[] = [
  { id: "fis-1", area: "fis" },
  { id: "fis-2", area: "fis" },
  { id: "men-1", area: "men" },
  { id: "emo-1", area: "emo" },
];

describe("selectDailyDose", () => {
  it("elige el área con menor % del ciclo entre las que tienen dosis sin ver", () => {
    const result = selectDailyDose({
      byAreaPercent: { fis: 80, men: 30, emo: 60 },
      doses: DOSES,
      completedDoseIds: new Set(),
    });
    expect(result?.area).toBe("men");
    expect(result?.doseId).toBe("men-1");
    expect(result?.isRecycled).toBe(false);
  });

  it("un área sin ningún hábito (percent null) cuenta como 0% — la más prioritaria", () => {
    const result = selectDailyDose({
      byAreaPercent: { fis: 10, men: 5, emo: null },
      doses: DOSES,
      completedDoseIds: new Set(),
    });
    expect(result?.area).toBe("emo");
  });

  it("ignora un área con % más bajo si no tiene NINGUNA dosis cargada", () => {
    const result = selectDailyDose({
      byAreaPercent: { fis: 90, men: 50, emo: 50, eco: 1 }, // "eco" es la más baja pero no tiene dosis
      doses: DOSES,
      completedDoseIds: new Set(),
    });
    expect(result?.area).not.toBe("eco");
  });

  it("ignora un área cuyas dosis YA están todas vistas, mientras otra área todavía tenga sin ver", () => {
    const result = selectDailyDose({
      byAreaPercent: { fis: 5, men: 90, emo: 90 }, // "fis" es la más baja...
      doses: DOSES,
      completedDoseIds: new Set(["fis-1", "fis-2"]), // ...pero ya agotó sus dosis
    });
    expect(result?.area).not.toBe("fis");
    expect(result?.area).toBe("men"); // men (90) y emo (90) empatan, gana la primera en BRAIN_AREAS
  });

  it("no repite una dosis de un área mientras esa área tenga otra sin ver", () => {
    const result = selectDailyDose({
      byAreaPercent: { fis: 10, men: 90, emo: 90 },
      doses: DOSES,
      completedDoseIds: new Set(["fis-1"]),
    });
    expect(result?.area).toBe("fis");
    expect(result?.doseId).toBe("fis-2"); // no vuelve a elegir fis-1
  });

  it("recicla (isRecycled: true) cuando TODAS las áreas con dosis ya están agotadas, prefiriendo la vista hace más tiempo", () => {
    const result = selectDailyDose({
      byAreaPercent: { fis: 10, men: 90, emo: 90 }, // "fis" claramente la más baja, sin ambigüedad de empate
      doses: DOSES,
      completedDoseIds: new Set(["fis-1", "fis-2", "men-1", "emo-1"]),
      lastCompletedAtByDoseId: new Map([
        ["fis-1", "2026-01-05"],
        ["fis-2", "2026-01-01"], // vista hace más tiempo que fis-1
      ]),
    });
    expect(result?.isRecycled).toBe(true);
    expect(result?.area).toBe("fis");
    expect(result?.doseId).toBe("fis-2");
  });

  it("al empatar en %, gana la primera área en el orden canónico (men/esp/emo/eco/fis/hab)", () => {
    const result = selectDailyDose({
      byAreaPercent: { fis: 50, men: 50, emo: 50 },
      doses: DOSES,
      completedDoseIds: new Set(),
    });
    expect(result?.area).toBe("men");
  });

  it("sin ninguna dosis cargada en el sistema, devuelve null", () => {
    expect(selectDailyDose({ byAreaPercent: {}, doses: [], completedDoseIds: new Set() })).toBeNull();
  });

  it("incluye el hábito pendiente de ayer del área elegida, cuando lo hay", () => {
    const habit = { id: "h1", name: "Salir a hacer ejercicio" };
    const result = selectDailyDose({
      byAreaPercent: { fis: 10, men: 90, emo: 90 },
      doses: DOSES,
      completedDoseIds: new Set(),
      yesterdayPendingHighPriorityHabitByArea: { fis: habit },
    });
    expect(result?.area).toBe("fis");
    expect(result?.yesterdayHabitForHook).toEqual(habit);
  });

  it("sin hábito pendiente de ayer para el área elegida, el gancho queda en null (no inventa uno)", () => {
    const result = selectDailyDose({
      byAreaPercent: { fis: 10, men: 90, emo: 90 },
      doses: DOSES,
      completedDoseIds: new Set(),
      yesterdayPendingHighPriorityHabitByArea: { men: { id: "x", name: "Otro hábito" } }, // de otra área, no cuenta
    });
    expect(result?.area).toBe("fis");
    expect(result?.yesterdayHabitForHook).toBeNull();
  });
});

describe("resolveHookText", () => {
  it("con hábito real, lo inserta en la plantilla", () => {
    expect(resolveHookText("Ayer no {habito}, aunque era prioridad alta.", { id: "h1", name: "Salir a hacer ejercicio" })).toBe(
      "Ayer no cumpliste con «Salir a hacer ejercicio», aunque era prioridad alta.",
    );
  });

  it("sin hábito real, usa una cláusula genérica en vez de inventar uno", () => {
    expect(resolveHookText("Ayer no {habito}, aunque era prioridad alta.", null)).toBe("Ayer no cumpliste con algo importante, aunque era prioridad alta.");
  });
});

describe("computeDoseStreak", () => {
  it("cuenta días consecutivos terminando hoy", () => {
    expect(computeDoseStreak(["2026-01-03", "2026-01-02", "2026-01-01"], "2026-01-03")).toBe(3);
  });

  it("si hoy todavía no hay dosis, sigue contando desde ayer (no rompe la racha)", () => {
    expect(computeDoseStreak(["2026-01-02", "2026-01-01"], "2026-01-03")).toBe(2);
  });

  it("un hueco corta la racha", () => {
    expect(computeDoseStreak(["2026-01-03", "2026-01-01"], "2026-01-03")).toBe(1); // falta el 02
  });

  it("sin ninguna dosis, racha 0", () => {
    expect(computeDoseStreak([], "2026-01-03")).toBe(0);
  });

  it("ignora fechas repetidas o desordenadas", () => {
    expect(computeDoseStreak(["2026-01-01", "2026-01-03", "2026-01-02", "2026-01-02", "2026-01-03"], "2026-01-03")).toBe(3);
  });
});

describe("weekStreakDays", () => {
  // 2026-01-01 es jueves.
  it("devuelve 7 días empezando en lunes", () => {
    const days = weekStreakDays([], "2026-01-01");
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.date)).toEqual(["2025-12-29", "2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"]);
  });

  it("marca `isToday` en el día correcto y nada más", () => {
    const days = weekStreakDays([], "2026-01-01");
    expect(days.filter((d) => d.isToday).map((d) => d.date)).toEqual(["2026-01-01"]);
  });

  it("marca `done` solo en los días con al menos una dosis completada", () => {
    const days = weekStreakDays(["2025-12-30", "2026-01-01"], "2026-01-01");
    expect(days.filter((d) => d.done).map((d) => d.date)).toEqual(["2025-12-30", "2026-01-01"]);
  });
});
