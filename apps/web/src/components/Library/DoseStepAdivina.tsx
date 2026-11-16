import { useState } from "react";
import type { BrainArea } from "../NeuralCore/brainTokens";
import { BRAIN_AREA_COLOR } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_BG, NEURAL_CYAN } from "../NeuralCore/tokens";

/** Paso 2 · ADIVINA. */
export function DoseStepAdivina({
  question,
  min,
  max,
  step,
  realValue,
  explanation,
  area,
  onComplete,
}: {
  question: string;
  min: number;
  max: number;
  step: number;
  realValue: number;
  explanation: string;
  area: BrainArea;
  onComplete: () => void;
}) {
  const [guess, setGuess] = useState(Math.round((min + max) / 2 / step) * step);
  const [revealed, setRevealed] = useState(false);
  const color = BRAIN_AREA_COLOR[area];

  function reveal() {
    if (revealed) return;
    setRevealed(true);
    onComplete();
  }

  const guessFrac = (guess - min) / (max - min);
  const realFrac = (realValue - min) / (max - min);

  return (
    <div className="flex flex-col gap-5">
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 15, color: "#E6E9F5" }}>{question}</span>

      <div className="flex flex-col items-center gap-3">
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 48, fontWeight: 700, color }}>{guess}</span>
        {!revealed && (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={guess}
            onChange={(e) => setGuess(Number(e.target.value))}
            style={{ width: "100%", accentColor: color }}
            aria-label={question}
          />
        )}
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={reveal}
          style={{ height: 48, borderRadius: 14, fontFamily: NEURAL_FONT_BODY, fontSize: 15, fontWeight: 700, color: NEURAL_BG, background: NEURAL_CYAN }}
        >
          Revelar la respuesta
        </button>
      ) : (
        <div className="flex flex-col gap-3" style={{ animation: "dose-pop .35s ease" }}>
          <div className="relative" style={{ height: 30, borderRadius: 15, background: "rgba(255,255,255,0.08)" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: 30,
                borderRadius: 15,
                width: `${Math.max(0, Math.min(100, realFrac * 100))}%`,
                background: NEURAL_CYAN,
              }}
            />
            <span
              style={{
                position: "absolute",
                left: `calc(${Math.max(0, Math.min(100, realFrac * 100))}% - 1px)`,
                top: 0,
                width: 2,
                height: 30,
                background: "#FFFFFF",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: `calc(${Math.max(0, Math.min(100, guessFrac * 100))}% - 5px)`,
                top: -6,
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: "2px solid #FFFFFF",
                background: "#070B1F",
              }}
              title="Tu estimación"
            />
            <span
              className="absolute inset-0 flex items-center justify-center"
              style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, fontWeight: 700, color: "#070B1F" }}
            >
              {realValue} %
            </span>
          </div>
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, lineHeight: 1.55, color: "#E6E9F5" }}>{explanation}</span>
        </div>
      )}
    </div>
  );
}
