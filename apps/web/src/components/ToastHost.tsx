import { useEffect, useState } from "react";
import { subscribeToast, type ToastKind } from "../lib/toast";

type ToastItem = { id: string; message: string; kind: ToastKind; leaving: boolean };

// La frase motivacional queda en pantalla el doble que un aviso común — es
// algo que invita a leerse, no solo a confirmarse de reojo.
const DURATION_MS: Record<ToastKind, number> = { default: 4000, quote: 8000 };

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

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 px-4">
      {toasts.map((t) =>
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
  );
}
