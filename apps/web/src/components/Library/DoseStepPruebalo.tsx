import { useEffect, useRef, useState } from "react";
import { BRAIN_AREA_COLOR, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY } from "../NeuralCore/tokens";

const HOLD_MS = 2000;
const RADIUS = 104;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const QUICK_PRESSES_TO_COMPLETE = 3;

/**
 * Paso 3 · PRUÉBALO AHORA — mantener presionado llena el anillo en ~2s
 * (pointerdown/up/leave, nunca `click` para el gesto principal: con
 * touch-action none evita que el navegador interprete el toque como scroll).
 * Accesible: 3 Enter o clics (el evento `click` nativo, que SÍ dispara con
 * Enter en un `<button>`) completan igual, sin necesidad de mantener nada
 * presionado.
 */
export function DoseStepPruebalo({
  instruction,
  completionText,
  area,
  onComplete,
}: {
  instruction: string;
  completionText: string;
  area: BrainArea;
  onComplete: () => void;
}) {
  const [fillPercent, setFillPercent] = useState(0);
  const [completed, setCompleted] = useState(false);
  const quickPressesRef = useRef(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const color = BRAIN_AREA_COLOR[area];

  function finish() {
    if (completed) return;
    setCompleted(true);
    setFillPercent(100);
    onComplete();
  }

  function startHold() {
    if (completed) return;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const pct = Math.min(100, (elapsed / HOLD_MS) * 100);
      setFillPercent(pct);
      if (pct >= 100) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function stopHold() {
    cancelAnimationFrame(rafRef.current);
    if (!completed) setFillPercent(0);
  }

  function handleClick() {
    if (completed) return;
    quickPressesRef.current += 1;
    if (quickPressesRef.current >= QUICK_PRESSES_TO_COMPLETE) finish();
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const offset = CIRCUMFERENCE * (1 - fillPercent / 100);
  const idle = fillPercent === 0 && !completed;

  return (
    <div className="flex flex-col items-center gap-5">
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 15, lineHeight: 1.5, color: "#E6E9F5", textAlign: "center" }}>{instruction}</span>

      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onClick={handleClick}
        aria-label="Mantén presionado hasta llenar el círculo (o toca 3 veces)"
        style={{ touchAction: "none", width: 220, height: 220, position: "relative", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
      >
        <svg width={220} height={220} viewBox="0 0 220 220" className={idle ? "dose-breathe" : undefined}>
          <circle cx={110} cy={110} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={12} />
          <circle
            cx={110}
            cy={110}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 110 110)"
            style={{ transition: fillPercent === 0 ? "stroke-dashoffset .3s ease" : "none" }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}
        >
          {completed ? "¡Lo lograste!" : `Mantén${fillPercent > 0 ? ` · ${Math.round(fillPercent)}%` : ""}`}
        </span>
      </button>

      {completed && (
        <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, lineHeight: 1.55, color: "#E6E9F5", textAlign: "center", animation: "dose-pop .35s ease" }}>
          {completionText}
        </p>
      )}
    </div>
  );
}
