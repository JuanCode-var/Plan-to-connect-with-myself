import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 400;

function IconArrowUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15.5V4.5" />
      <path d="M5 9.5L10 4.5l5 5" />
    </svg>
  );
}

/**
 * Botón flotante "volver arriba": aparece recién después de scrollear
 * SHOW_AFTER_PX hacia abajo (no tiene sentido antes, ya estás arriba) y
 * queda montado siempre (no `{visible && ...}`) para poder animar la
 * entrada/salida con una transición en vez de un salto — igual que el resto
 * de los popovers del app, ver `.scroll-top-btn` en index.css.
 * `pointer-events: none` mientras está oculto evita que tape clics de lo
 * que hay debajo en esa esquina cuando no se ve.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className="scroll-top-btn fixed right-4 bottom-20 z-40 flex h-10 w-10 items-center justify-center rounded-full shadow-lg md:bottom-6"
      style={{
        background: "var(--accent)",
        color: "var(--accent-ink)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.9)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <IconArrowUp />
    </button>
  );
}
