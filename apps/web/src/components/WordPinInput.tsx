import { useImperativeHandle, useRef, forwardRef } from "react";
import { NEURAL_LAVENDER } from "./NeuralCore/tokens";

export type WordPinInputHandle = { shake: () => void };

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

/**
 * Entrada de PIN con teclado numérico propio en pantalla (mockup 12): 4
 * puntos arriba (violeta al llenarse) + grilla de 12 teclas circulares
 * abajo — reemplaza el `<input>` nativo invisible de antes. Sin botón
 * "Entrar": al llegar a 4 dígitos, el padre dispara `onSubmit` solo (ver
 * WordLockScreen.tsx).
 */
export const WordPinInput = forwardRef<
  WordPinInputHandle,
  {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  }
>(function WordPinInput({ value, onChange, disabled }, ref) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    shake: () => {
      const el = wrapperRef.current;
      if (!el) return;
      el.classList.remove("word-pin-shake");
      // Forzar reflow para poder re-disparar la animación si el usuario se
      // equivoca dos veces seguidas (sin esto, remover y volver a agregar la
      // misma clase en el mismo tick no reinicia el keyframe).
      void el.offsetWidth;
      el.classList.add("word-pin-shake");
    },
  }));

  function pressDigit(d: string) {
    if (disabled || value.length >= PIN_LENGTH) return;
    onChange(value + d);
  }

  function pressBackspace() {
    if (disabled) return;
    onChange(value.slice(0, -1));
  }

  return (
    <div ref={wrapperRef} className="flex flex-col items-center gap-9">
      <div className="flex items-center justify-center gap-3" aria-hidden>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className="h-3.5 w-3.5 rounded-full border-2 transition-all duration-150"
            style={{
              borderColor: NEURAL_LAVENDER,
              background: i < value.length ? NEURAL_LAVENDER : "transparent",
              transform: i < value.length ? "scale(1)" : "scale(0.85)",
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3.5" role="group" aria-label="Teclado numérico">
        {KEYS.map((key, i) => {
          if (key === "") return <span key={i} aria-hidden />;
          const isBackspace = key === "⌫";
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => (isBackspace ? pressBackspace() : pressDigit(key))}
              aria-label={isBackspace ? "Borrar" : key}
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-2xl font-bold transition-transform active:scale-95 disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.14)", color: "#FFFFFF" }}
            >
              {isBackspace ? "⌫" : key}
            </button>
          );
        })}
      </div>
    </div>
  );
});
