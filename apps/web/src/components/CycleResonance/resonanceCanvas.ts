/**
 * Reglas globales de rendimiento/accesibilidad para los canvas que van a
 * sumar las pantallas de "Resonancia del ciclo" (Mapa de conexiones,
 * Electroencefalograma) — mismo criterio ya usado en AnimatedBackground.tsx
 * y useBrainImpulseEngine.ts, centralizado acá para no repetir el chequeo
 * de `matchMedia` ni el tope de densidad de píxeles en cada pantalla nueva.
 */

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** `devicePixelRatio` real, topeado en 2 — una pantalla 3x/4x no necesita más nitidez a costa de 2-4x el trabajo de pintado por frame. */
export function cappedDevicePixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, 2);
}

/**
 * Ajusta un `<canvas>` al tamaño real (en CSS px) de su contenedor,
 * respetando `cappedDevicePixelRatio()` — reemplaza el patrón `resize()`
 * que hoy repite AnimatedBackground.tsx a mano. Devuelve el tamaño en CSS
 * px (lo que necesita el código de dibujo para sus cálculos).
 */
export function sizeCanvasToContainer(canvas: HTMLCanvasElement, container: HTMLElement): { width: number; height: number } {
  const dpr = cappedDevicePixelRatio();
  const width = container.clientWidth;
  const height = container.clientHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}
