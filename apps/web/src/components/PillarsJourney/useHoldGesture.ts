import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const HOLD_MS = 1300;

/**
 * Gesto de "mantén para cruzar/activar" (Umbral, Paso 4; ritual de
 * reprogramar creencia, Valores fase 4) — progreso 0..1 durante HOLD_MS,
 * se resetea a 0 si se suelta antes de completar. Accesible con teclado
 * (Enter mantenido, igual que pointerdown/up) y respeta
 * prefers-reduced-motion (completa al instante en vez de animar).
 */
export function useHoldGesture(onComplete: () => void) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    if (!doneRef.current) setProgress(0);
  }, []);

  const start = useCallback(() => {
    if (doneRef.current) return;
    if (reducedMotion) {
      doneRef.current = true;
      setProgress(1);
      onComplete();
      return;
    }
    startRef.current = performance.now();
    const tick = (now: number) => {
      if (startRef.current === null) return;
      const elapsed = now - startRef.current;
      const next = Math.min(1, elapsed / HOLD_MS);
      setProgress(next);
      if (next >= 1) {
        doneRef.current = true;
        onComplete();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onComplete, reducedMotion]);

  useEffect(() => stop, [stop]);

  const handlers = {
    onPointerDown: (e: PointerEvent) => {
      e.preventDefault();
      start();
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (startRef.current === null) start();
      }
    },
    onKeyUp: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") stop();
    },
  };

  return { progress, handlers };
}
