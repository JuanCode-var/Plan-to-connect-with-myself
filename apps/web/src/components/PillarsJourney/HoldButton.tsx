import { NEURAL_CYAN } from "../NeuralCore/tokens";
import { useHoldGesture } from "./useHoldGesture";

/** Botón circular "mantén para cruzar/activar" — anillo cian con conic-gradient que se llena durante el hold (Paso 7: accesible con Enter, touch-action none). */
export function HoldButton({ size = 96, icon = "→", onComplete }: { size?: number; icon?: string; onComplete: () => void }) {
  const { progress, handlers } = useHoldGesture(onComplete);
  const deg = Math.round(progress * 360);

  return (
    <button
      type="button"
      aria-label="Mantén presionado para continuar"
      {...handlers}
      className="flex shrink-0 items-center justify-center rounded-full outline-none"
      style={{
        width: size,
        height: size,
        touchAction: "none",
        background: `conic-gradient(${NEURAL_CYAN} ${deg}deg, rgba(34,211,238,0.14) ${deg}deg)`,
        transition: progress === 0 ? "background 0.2s ease" : "none",
      }}
    >
      <span
        className="flex items-center justify-center rounded-full"
        style={{
          width: size - 14,
          height: size - 14,
          background: "#070B1F",
          color: NEURAL_CYAN,
          fontSize: size * 0.3,
        }}
        aria-hidden
      >
        {icon}
      </span>
    </button>
  );
}
