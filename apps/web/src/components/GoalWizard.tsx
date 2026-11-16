import { useState } from "react";
import { useCompass } from "../api/compass";
import { useCreateGoal } from "../api/goals";
import type { HabitCategory } from "../domain";
import { BRAIN_AREAS, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, CATEGORY_OF_AREA } from "./NeuralCore/brainTokens";
import { NEURAL_BG, NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import { splitLines } from "./PillarsJourney/pillarsJourneyShared";
import { addDaysISO, todayISO } from "../lib/date";
import { daysBetween, formatShortDate } from "../lib/goalCycle";

type Step = "titulo" | "porque" | "visualizacion" | "medir";
const STEPS: Step[] = ["titulo", "porque", "visualizacion", "medir"];

const STEP_QUESTIONS: Record<Step, string> = {
  titulo: "¿Qué quieres lograr este ciclo?",
  porque: "¿Por qué te importa?",
  visualizacion: "Imagina que ya lo lograste",
  medir: "¿Cómo sabrás que la cumpliste?",
};
const STEP_HELP: Record<Step, string> = {
  titulo: "Específico y pequeño: algo que puedas contar.",
  porque: "Una razón real te sostiene en los días difíciles.",
  visualizacion: "Opcional. ¿Qué ves, qué sientes, qué escuchas?",
  medir: "Un número y una fecha. Nada más.",
};

function lowercaseFirst(text: string): string {
  return text.length > 0 ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function stepIndex(step: Step): number {
  return STEPS.indexOf(step);
}

/**
 * Creación guiada de una meta (mockups 15b-15d) — reemplaza el formulario
 * largo de siempre por 4 preguntas, una por vez, método Brian Tracy (qué,
 * por qué, para cuándo, por escrito). Vive INLINE en /metas, en el mismo
 * lugar donde estaba la rejilla (no es un modal con backdrop): en mobile
 * ocupa toda la pantalla gratis, simplemente porque no hay nada más
 * compitiendo por espacio alrededor.
 */
export function GoalWizard({
  cycleId,
  cycleStartDate,
  cycleEndDate,
  initialTitle,
  initialArea,
  onCreated,
  onCancel,
}: {
  cycleId: string;
  cycleStartDate: string;
  cycleEndDate: string;
  initialTitle?: string;
  initialArea?: HabitCategory;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>("titulo");
  const [title, setTitle] = useState(initialTitle ?? "");
  const [area, setArea] = useState<HabitCategory | null>(initialArea ?? null);
  const [why, setWhy] = useState("");
  const [visualization, setVisualization] = useState("");
  const [targetCount, setTargetCount] = useState(1);
  const [unit, setUnit] = useState("");
  const [targetDate, setTargetDate] = useState(cycleEndDate.slice(0, 10));
  const [customDate, setCustomDate] = useState(false);

  const { data: compass } = useCompass();
  const createGoal = useCreateGoal();

  const idx = stepIndex(step);
  const today = todayISO();
  const cycleEnd = cycleEndDate.slice(0, 10);
  const twoWeeksDate = (() => {
    const candidate = addDaysISO(today, 14);
    return candidate < cycleEnd ? candidate : null;
  })();

  function canAdvance(): boolean {
    if (step === "titulo") return title.trim().length > 0 && area !== null;
    if (step === "medir") return targetCount >= 1 && unit.trim().length > 0 && !!targetDate;
    return true;
  }

  function goBack() {
    if (idx === 0) return;
    setStep(STEPS[idx - 1]);
  }

  function goNext() {
    if (!canAdvance()) return;
    if (step !== "medir") {
      setStep(STEPS[idx + 1]);
      return;
    }
    createGoal.mutate(
      {
        cycleId,
        title: title.trim(),
        area: area!,
        why: why.trim() || undefined,
        visualization: visualization.trim() || undefined,
        targetCount,
        unit: unit.trim(),
        targetDate,
      },
      { onSuccess: onCreated },
    );
  }

  function addValueToWhy(value: string) {
    const clause = `Es fiel a mi ${lowercaseFirst(value)}.`;
    setWhy((prev) => (prev.trim() ? `${prev.trim()} ${clause}` : clause));
  }

  const values = splitLines(compass?.coreValues);
  const daysUntilTarget = targetDate ? daysBetween(today, targetDate) : 0;

  return (
    <div
      className="micro-view-in mx-auto flex w-full max-w-[720px] flex-col gap-6 rounded-[28px] border p-6 sm:p-10"
      style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: NEURAL_LAVENDER }}>
            Nueva meta · Paso {idx + 1} de 4
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
            style={{ color: NEURAL_TEXT_SECONDARY }}
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className="h-1.5 rounded-full transition-colors duration-300"
              style={{ background: i <= idx ? NEURAL_CYAN : "rgba(255,255,255,.1)" }}
            />
          ))}
        </div>
      </div>

      <div key={step} className="micro-view-in flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display m-0 text-2xl font-bold sm:text-[26px]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
            {STEP_QUESTIONS[step]}
          </h2>
          <p className="font-reading m-0 text-base italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_LAVENDER }}>
            {STEP_HELP[step]}
          </p>
        </div>

        {step === "titulo" && (
          <div className="flex flex-col gap-4">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Hacer mis primeras 3 ofertas de venta"
              className="rounded-xl border p-3.5 text-base"
              style={{ background: NEURAL_BG, borderColor: "rgba(34,211,238,.35)", color: NEURAL_TEXT }}
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                ¿A qué área pertenece?
              </span>
              <div className="flex flex-wrap gap-2">
                {BRAIN_AREAS.map((brainArea) => {
                  const category = CATEGORY_OF_AREA[brainArea];
                  const color = BRAIN_AREA_COLOR[brainArea];
                  const selected = area === category;
                  return (
                    <button
                      key={brainArea}
                      type="button"
                      onClick={() => setArea(category)}
                      className="flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold"
                      style={{
                        borderColor: selected ? color : NEURAL_CARD_BORDER,
                        background: selected ? `${color}1F` : "transparent",
                        color: selected ? color : NEURAL_TEXT,
                      }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                      {BRAIN_AREA_LABEL[brainArea]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === "porque" && (
          <div className="flex flex-col gap-4">
            <textarea
              autoFocus
              rows={3}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              className="font-reading resize-none rounded-xl border p-3.5 text-base leading-relaxed"
              style={{ background: NEURAL_BG, borderColor: "rgba(34,211,238,.35)", color: NEURAL_TEXT, fontFamily: "'Lora', Georgia, serif" }}
            />
            {values.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  Conéctala con uno de tus valores:
                </span>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => addValueToWhy(value)}
                      className="rounded-full border px-3.5 py-1.5 text-sm"
                      style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "visualizacion" && (
          <div className="flex flex-col gap-3">
            <textarea
              autoFocus
              rows={3}
              value={visualization}
              onChange={(e) => setVisualization(e.target.value)}
              className="font-reading resize-none rounded-xl border p-3.5 text-base leading-relaxed"
              style={{ background: NEURAL_BG, borderColor: "rgba(34,211,238,.35)", color: NEURAL_TEXT, fontFamily: "'Lora', Georgia, serif" }}
            />
            <button type="button" onClick={goNext} className="self-start text-sm font-semibold" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Saltar
            </button>
          </div>
        )}

        {step === "medir" && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3" style={{ gridTemplateColumns: "90px minmax(0, 1fr)" }}>
              <input
                type="number"
                min={1}
                step={1}
                value={targetCount}
                onChange={(e) => setTargetCount(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                className="h-14 rounded-xl border px-3 text-center text-xl font-bold"
                style={{ background: NEURAL_BG, borderColor: "rgba(34,211,238,.35)", color: NEURAL_TEXT }}
              />
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="ofertas hechas"
                className="h-14 rounded-xl border px-3.5 text-base"
                style={{ background: NEURAL_BG, borderColor: "rgba(34,211,238,.35)", color: NEURAL_TEXT }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                ¿Para cuándo?
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetDate(cycleEnd);
                    setCustomDate(false);
                  }}
                  className="rounded-full px-3.5 py-2 text-sm font-semibold"
                  style={
                    !customDate && targetDate === cycleEnd
                      ? { background: NEURAL_CYAN, color: "#070B1F" }
                      : { border: `1px solid ${NEURAL_CARD_BORDER}`, color: NEURAL_TEXT }
                  }
                >
                  Fin del ciclo · {formatShortDate(cycleEnd)}
                </button>
                {twoWeeksDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetDate(twoWeeksDate);
                      setCustomDate(false);
                    }}
                    className="rounded-full px-3.5 py-2 text-sm font-semibold"
                    style={
                      !customDate && targetDate === twoWeeksDate
                        ? { background: NEURAL_CYAN, color: "#070B1F" }
                        : { border: `1px solid ${NEURAL_CARD_BORDER}`, color: NEURAL_TEXT }
                    }
                  >
                    En 2 semanas · {formatShortDate(twoWeeksDate)}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCustomDate(true)}
                  className="rounded-full px-3.5 py-2 text-sm font-semibold"
                  style={
                    customDate
                      ? { background: NEURAL_CYAN, color: "#070B1F" }
                      : { border: `1px solid ${NEURAL_CARD_BORDER}`, color: NEURAL_TEXT }
                  }
                >
                  Otra fecha…
                </button>
              </div>
              {customDate && (
                <input
                  type="date"
                  value={targetDate}
                  min={cycleStartDate.slice(0, 10)}
                  max={cycleEnd}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="rounded-xl border p-2.5 text-sm"
                  style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5 rounded-xl border p-4" style={{ borderColor: NEURAL_CARD_BORDER, background: "rgba(255,255,255,.03)" }}>
              <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: NEURAL_LAVENDER }}>
                Así quedará tu meta
              </span>
              <span className="text-base font-bold">{title.trim() || "—"}</span>
              <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                {targetCount} {unit.trim() || "unidad"} · vence {targetDate ? formatShortDate(targetDate) : "—"}
                {targetDate && ` · ${Math.max(daysUntilTarget, 0)} días`}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {idx > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="rounded-xl border px-5 py-2.5 text-sm font-bold"
            style={{ borderColor: "rgba(34,211,238,.45)", color: NEURAL_CYAN }}
          >
            ← Atrás
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={!canAdvance() || createGoal.isPending}
          onClick={goNext}
          className="rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40"
          style={{ background: NEURAL_CYAN, color: "#070B1F" }}
        >
          {step === "medir" ? (createGoal.isPending ? "Guardando…" : "Crear meta") : "Siguiente →"}
        </button>
      </div>

      {createGoal.isError && (
        <p className="text-sm" style={{ color: "#F87171" }}>
          No se pudo crear la meta.
        </p>
      )}

      <p className="m-0 text-center text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Método de metas de Brian Tracy: qué, para cuándo y por qué, por escrito.
      </p>
    </div>
  );
}
