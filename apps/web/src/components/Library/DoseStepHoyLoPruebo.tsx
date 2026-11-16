import { useState } from "react";
import { BRAIN_AREA_COLOR, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import type { DoseAction } from "../../api/doses";

const FLIGHT_DELAY_MS = 900;

/**
 * Paso 5 · HOY LO PRUEBO — elegir una acción dispara, en este orden: la
 * animación de los 5 puntos de luz (puramente visual), y recién después
 * `onChoose` (que el padre usa para crear la micro acción real + mandar el
 * impulso real + pasar a DOSIS COMPLETADA) — así el usuario ve el gesto
 * antes de que la pantalla cambie de golpe.
 */
export function DoseStepHoyLoPruebo({ actions, area, onChoose }: { actions: DoseAction[]; area: BrainArea; onChoose: (index: number) => void }) {
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const color = BRAIN_AREA_COLOR[area];

  function choose(i: number) {
    if (chosenIndex !== null) return;
    setChosenIndex(i);
    window.setTimeout(() => onChoose(i), FLIGHT_DELAY_MS);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>Elige tu callo mental de hoy.</span>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, color: NEURAL_TEXT_SECONDARY }}>Pequeño, pero hoy.</span>
      </div>

      <div className="relative flex flex-col gap-2.5">
        {actions.map((action, i) => {
          const selected = chosenIndex === i;
          return (
            <button
              key={action.text}
              type="button"
              onClick={() => choose(i)}
              disabled={chosenIndex !== null}
              style={{
                minHeight: 64,
                padding: "10px 18px",
                borderRadius: 14,
                textAlign: "left",
                fontFamily: NEURAL_FONT_BODY,
                color: selected ? "#070B1F" : "#E6E9F5",
                background: selected ? color : "rgba(255,255,255,0.04)",
                border: `1px solid ${selected ? color : "rgba(255,255,255,0.12)"}`,
                cursor: chosenIndex === null ? "pointer" : "default",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 2,
                transition: "background .2s ease, color .2s ease",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700 }}>{action.text}</span>
              <span style={{ fontSize: 12.5, color: selected ? "rgba(7,11,31,0.75)" : NEURAL_TEXT_SECONDARY }}>{action.detail}</span>
            </button>
          );
        })}

        {chosenIndex !== null && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className="dose-light-dot"
                style={{
                  position: "absolute",
                  left: `${20 + i * 15}%`,
                  bottom: 10,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 8px ${color}`,
                  animationDelay: `${i * 70}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
