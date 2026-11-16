import { useState } from "react";
import type { BrainArea } from "../NeuralCore/brainTokens";
import { BRAIN_AREA_COLOR, BRAIN_AREA_RGB } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY } from "../NeuralCore/tokens";

/** Paso 1 · GANCHO. */
export function DoseStepGancho({
  hookText,
  question,
  options,
  answer,
  area,
  onComplete,
}: {
  hookText: string;
  question: string;
  options: string[];
  answer: string;
  area: BrainArea;
  onComplete: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const color = BRAIN_AREA_COLOR[area];
  const rgb = BRAIN_AREA_RGB[area];

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    onComplete();
  }

  return (
    <div className="flex flex-col gap-5">
      <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 27, fontWeight: 700, lineHeight: 1.3, color: "#FFFFFF" }}>{hookText}</span>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 15, color: "#E6E9F5" }}>{question}</span>

      <div className="flex flex-col gap-2.5">
        {options.map((option, i) => {
          const selected = picked === i;
          return (
            <button
              key={option}
              type="button"
              onClick={() => pick(i)}
              disabled={picked !== null}
              style={{
                height: 52,
                padding: "0 18px",
                borderRadius: 14,
                textAlign: "left",
                fontFamily: NEURAL_FONT_BODY,
                fontSize: 15,
                fontWeight: 600,
                color: selected ? "#070B1F" : "#E6E9F5",
                background: selected ? color : `rgba(${rgb},0.08)`,
                border: `1px solid rgba(${rgb},${selected ? 1 : 0.4})`,
                cursor: picked === null ? "pointer" : "default",
                transition: "background .2s ease, color .2s ease",
              }}
            >
              {option}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div
          className="rounded-2xl p-4"
          style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.4)`, animation: "dose-pop .35s ease" }}
        >
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, lineHeight: 1.55, color: "#FFFFFF" }}>{answer}</span>
        </div>
      )}
    </div>
  );
}
