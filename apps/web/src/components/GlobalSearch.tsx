import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHabits } from "../api/habits";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M12.6 12.6L17 17" />
    </svg>
  );
}

/**
 * Buscador real (no decorativo): filtra los hábitos ya cacheados por
 * `useHabits()` — mismo query que ya usa /habits, React Query lo dedupe,
 * no suma una llamada nueva a la API. Elegir un resultado navega a
 * /habits (todavía no hay una vista de detalle de un hábito suelto).
 */
export function GlobalSearch() {
  const { data: habits } = useHabits();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("click", onClickOutside);
    return () => window.removeEventListener("click", onClickOutside);
  }, []);

  const matches =
    query.trim().length > 0
      ? (habits ?? []).filter((h) => h.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5)
      : [];

  function goToHabits() {
    setOpen(false);
    setQuery("");
    navigate("/habits");
  }

  return (
    <div ref={containerRef} className="relative hidden min-w-0 flex-1 max-w-sm sm:block">
      <div
        className="flex items-center gap-2 rounded-xl border px-3 py-2"
        style={{ background: "var(--bg-secondary, var(--bg))", borderColor: "var(--border)", color: "var(--text-2)" }}
      >
        <SearchIcon />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar hábitos…"
          aria-label="Buscar hábitos"
          className="w-full bg-transparent text-sm outline-none"
          style={{ color: "var(--text)" }}
        />
      </div>

      {open && matches.length > 0 && (
        <ul
          className="absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-xl border shadow-2xl"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {matches.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={goToHabits}
                className="block w-full truncate px-3 py-2 text-left text-sm"
                style={{ color: "var(--text)" }}
              >
                {h.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
