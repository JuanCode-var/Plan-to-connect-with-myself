import { useEffect, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Cuenta de 0 al valor real al montar (ease-out cúbico), en vez de aparecer
 * ya con el número final — mismo espíritu que ProgressRing (que ya hacía
 * esto para el anillo, no para el texto). Pedido explícito: el Resumen "no
 * emociona tanto"; un número que sube de un vistazo pesa más que uno estático.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const reduced = prefersReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    // Ya arrancó en `target` por el useState de arriba — nada que animar.
    if (reduced) return;
    let raf: number;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduced]);

  return value;
}
