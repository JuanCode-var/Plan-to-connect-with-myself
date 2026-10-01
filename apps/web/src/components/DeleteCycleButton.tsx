import { useEffect, useRef, useState } from "react";
import { useDeleteCycle } from "../api/tracking";

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h12" />
      <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6" />
      <path d="M5.5 6l.6 9.5A1.5 1.5 0 0 0 7.6 17h4.8a1.5 1.5 0 0 0 1.5-1.5L14.5 6" />
    </svg>
  );
}

/**
 * Botón de eliminar ciclo: en vez de `window.confirm` (prohibido por
 * convención del proyecto, ver comentarios en api/tracking.ts sobre "nunca
 * un alert()"), abre un popover propio con la confirmación. Borrar el ciclo
 * borra también sus HabitLog (ver DELETE /cycles/:id) — irreversible, por
 * eso el paso extra de confirmación.
 */
export function DeleteCycleButton({
  cycleId,
  cycleName,
  onDeleted,
}: {
  cycleId: string;
  cycleName: string;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const deleteCycle = useDeleteCycle();

  useEffect(() => {
    if (!confirming) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setConfirming(false);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [confirming]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setConfirming((v) => !v);
        }}
        aria-label="Eliminar ciclo"
        title="Eliminar ciclo"
        className="flex h-9 w-9 items-center justify-center rounded-lg border"
        style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
      >
        <IconTrash />
      </button>

      {confirming && (
        <div
          className="absolute right-0 z-30 mt-2 w-64 rounded-xl border p-3 shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text)" }}>
            ¿Eliminar <strong>{cycleName}</strong>? Se borran también todos sus registros marcados.
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-2)" }}>
            Esta acción no se puede deshacer.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border px-3 py-1.5 text-xs"
              style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deleteCycle.isPending}
              onClick={() => {
                deleteCycle.mutate(cycleId, {
                  onSuccess: () => {
                    setConfirming(false);
                    onDeleted();
                  },
                });
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: "#B91C1C" }}
            >
              {deleteCycle.isPending ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
