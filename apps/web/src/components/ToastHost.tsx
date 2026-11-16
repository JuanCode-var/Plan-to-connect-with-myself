import { useEffect, useState } from "react";
import { subscribeToast, type ToastKind } from "../lib/toast";

type ToastItem = { id: string; message: string; kind: ToastKind; leaving: boolean };

function CompassIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="10" cy="10" r="7.2" />
      <path d="M12.6 7.4l-1.8 3.9-3.9 1.8 1.8-3.9 3.9-1.8z" strokeLinejoin="round" />
    </svg>
  );
}

// La frase motivacional (de la Biblioteca o de Mi Identidad) queda en
// pantalla el doble que un aviso común — invitan a leerse, no solo a
// confirmarse de reojo.
const DURATION_MS: Record<ToastKind, number> = { default: 4000, quote: 8000, identity: 8000 };

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToast((message, kind) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, kind, leaving: false }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      }, DURATION_MS[kind]);
    });
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
  }

  function handleAnimationEnd(t: ToastItem) {
    if (t.leaving) setToasts((prev) => prev.filter((x) => x.id !== t.id));
  }

  if (toasts.length === 0) return null;

  // Los de "identity" viven en su propia franja a TODO EL ANCHO arriba de
  // la pantalla (pedido explícito del usuario) — no una burbuja flotante
  // más, una zona propia que ocupa todo el borde superior, para que de un
  // vistazo se sepa cuál es cuál incluso antes de leer el texto.
  // "quote"/"default" se quedan abajo, como siempre.
  const topToasts = toasts.filter((t) => t.kind === "identity");
  const bottomToasts = toasts.filter((t) => t.kind !== "identity");

  return (
    <>
      {topToasts.length > 0 && (
        <div className="fixed inset-x-0 top-0 z-50 flex flex-col">
          {topToasts.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => dismiss(t.id)}
              onAnimationEnd={() => handleAnimationEnd(t)}
              role="status"
              title="Tocar para cerrar"
              className={`${t.leaving ? "toast-out-top" : "toast-in-top"} font-reading w-full border-b-2 px-4 py-3 text-left shadow-2xl sm:px-8`}
              style={{ background: "var(--surface)", borderColor: "var(--accent)", color: "var(--text)" }}
            >
              <div className="mx-auto flex max-w-3xl flex-col gap-1">
                <span
                  className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] uppercase"
                  style={{ color: "var(--accent)" }}
                >
                  <CompassIcon />
                  Mi Identidad
                </span>
                <span className="text-[15px] leading-snug">{t.message}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {bottomToasts.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 px-4">
          {bottomToasts.map((t) =>
            t.kind === "quote" ? (
              <button
                key={t.id}
                type="button"
                onClick={() => dismiss(t.id)}
                onAnimationEnd={() => handleAnimationEnd(t)}
                role="status"
                title="Tocar para cerrar"
                className={`${t.leaving ? "toast-out" : "toast-in"} font-reading max-w-md rounded-2xl border px-5 py-3.5 text-left text-[15px] italic leading-snug shadow-2xl`}
                style={{ background: "var(--surface)", borderColor: "var(--border)", borderLeft: "3px solid var(--accent)", color: "var(--text)" }}
              >
                {t.message}
              </button>
            ) : (
              <div
                key={t.id}
                role="status"
                onClick={() => dismiss(t.id)}
                onAnimationEnd={() => handleAnimationEnd(t)}
                className={`${t.leaving ? "toast-out" : "toast-in"} cursor-pointer rounded-md bg-black/90 px-4 py-2 text-center text-sm text-white shadow-lg`}
              >
                {t.message}
              </div>
            ),
          )}
        </div>
      )}
    </>
  );
}
