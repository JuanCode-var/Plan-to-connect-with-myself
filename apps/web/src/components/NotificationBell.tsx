import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCycleLogs, useCycles } from "../api/tracking";
import { useGoals } from "../api/goals";
import { useWordCommitments } from "../api/word";
import { buildNotifications } from "../lib/notifications";

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 8a5 5 0 0 1 10 0c0 3.2 1 4.6 1.6 5.3a.6.6 0 0 1-.5 1H3.9a.6.6 0 0 1-.5-1C4 12.6 5 11.2 5 8Z" />
      <path d="M8 16.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

/**
 * Campanita real: los avisos se derivan en `buildNotifications` a partir de
 * datos ya cacheados por React Query en otras páginas (ciclo activo, metas,
 * Mi Palabra) — mismo criterio que GlobalSearch con useHabits(). Ningún
 * dato nuevo se inventa; si no hay nada accionable, el dropdown lo dice en
 * vez de mostrar un contador vacío fingido.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const { data: cycles } = useCycles();
  const activeCycleId = cycles && cycles.length > 0
    ? (cycles.find((c) => c.isActive) ?? cycles[cycles.length - 1]).id
    : undefined;
  const { data: cycleLogs } = useCycleLogs(activeCycleId);
  const { data: goals } = useGoals(activeCycleId);
  const { data: wordCommitments } = useWordCommitments();

  const notifications = buildNotifications({ cycleLogs, goals, wordCommitments });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("click", onClickOutside);
    return () => window.removeEventListener("click", onClickOutside);
  }, []);

  function goTo(to: string) {
    setOpen(false);
    navigate(to);
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={notifications.length > 0 ? `${notifications.length} avisos pendientes` : "Sin avisos pendientes"}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border transition-transform hover:scale-105 active:scale-95"
        style={{ borderColor: "var(--border)", color: "var(--text-2)", background: "var(--bg-secondary, var(--bg))" }}
      >
        <BellIcon />
        {notifications.length > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
            style={{ background: "var(--accent-yellow, var(--accent))", color: "var(--accent-ink)" }}
          >
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-30 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border shadow-2xl"
          style={{ background: "var(--surface-solid, var(--surface))", borderColor: "var(--border)" }}
        >
          <div
            className="border-b px-4 py-2.5 text-xs font-semibold tracking-wide uppercase"
            style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
          >
            Avisos
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-2)" }}>
              Estás al día — sin avisos pendientes.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => goTo(n.to)}
                    className="block w-full border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--accent-soft)]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span className="block text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {n.title}
                    </span>
                    <span className="block truncate text-xs" style={{ color: "var(--text-2)" }}>
                      {n.detail}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
