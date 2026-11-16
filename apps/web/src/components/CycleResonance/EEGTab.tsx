import { useMemo } from "react";
import { EEGChart } from "./EEGChart";
import { PatternCard } from "./PatternCard";
import { ResilienceCard } from "./ResilienceCard";
import { TimeInStateCard } from "./TimeInStateCard";
import { WeeklyExperimentCard } from "./WeeklyExperimentCard";
import { computePattern, computeResilience, timeInState, weeklyExperimentText, type EEGDay } from "./eegAnalysis";
import { DAY_STATES } from "./resonanceTokens";
import { NEURAL_CARD_BG, NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import type { useCycleResonance } from "./useCycleResonance";

const MIN_DAYS = 5;

type Resonance = ReturnType<typeof useCycleResonance>;

/**
 * "Electroencefalograma" — puerto de EEG.dc.html (sección "reemplaza
 * Tendencia diaria" del pedido). Usa `resonance.byDay` tal cual lo calcula
 * el backend (services/tracking.ts) — nunca se reimplementa el % por día
 * acá, solo se reagrupa a `EEGDay[]` para el gráfico y el análisis
 * (eegAnalysis.ts).
 */
export function EEGTab({ resonance }: { resonance: Resonance }) {
  const days: EEGDay[] = useMemo(
    () => resonance.byDay.map((d) => ({ date: d.date, percent: Math.round(d.completionRate * 100) })),
    [resonance.byDay],
  );

  if (days.length < MIN_DAYS) {
    return (
      <div
        className="mx-auto flex max-w-[1360px] flex-col items-center justify-center gap-2 rounded-[24px] p-10 text-center"
        style={{ background: NEURAL_CARD_BG, border: "1px solid rgba(34,211,238,0.25)", minHeight: 280 }}
      >
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>
          Todavía no hay suficiente historia
        </span>
        <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, color: NEURAL_TEXT_SECONDARY, maxWidth: 420 }}>
          El electroencefalograma necesita al menos {MIN_DAYS} días transcurridos del ciclo para tener algo que leer — llevas{" "}
          {days.length} {days.length === 1 ? "día" : "días"}. Vuelve en unos días.
        </p>
      </div>
    );
  }

  const pastDays = days.slice(0, -1);
  const resilience = computeResilience(pastDays);
  const states = timeInState(pastDays);
  const pattern = computePattern(pastDays);
  const experiment = weeklyExperimentText(states, pattern);

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6">
      <div
        className="rounded-[24px] p-6"
        style={{ background: NEURAL_CARD_BG, border: "1px solid rgba(34,211,238,0.25)", boxShadow: "0 30px 80px rgba(0,0,0,0.45)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="m-0" style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>
              Electroencefalograma del ciclo
            </h2>
            <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>
              Día {days.length} del ciclo · cada punto es un día · el fondo muestra en qué estado estuvo tu núcleo
            </span>
          </div>
          <div className="flex flex-wrap gap-4" style={{ fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>
            {[...DAY_STATES].map((s) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <EEGChart days={days} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResilienceCard resilience={resilience} />
        <TimeInStateCard states={states} />
        <PatternCard pattern={pattern} />
        <WeeklyExperimentCard text={experiment} />
      </div>
    </div>
  );
}
