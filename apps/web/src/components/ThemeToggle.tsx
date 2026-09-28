import type { Theme } from "../lib/themeContext";

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Cambiar entre modo claro y oscuro"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border transition-colors"
      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-2)" }}
    >
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="9" cy="9" r="3.2" />
          <line x1="9" y1="1.5" x2="9" y2="3.2" />
          <line x1="9" y1="14.8" x2="9" y2="16.5" />
          <line x1="1.5" y1="9" x2="3.2" y2="9" />
          <line x1="14.8" y1="9" x2="16.5" y2="9" />
          <line x1="3.6" y1="3.6" x2="4.8" y2="4.8" />
          <line x1="13.2" y1="13.2" x2="14.4" y2="14.4" />
          <line x1="3.6" y1="14.4" x2="4.8" y2="13.2" />
          <line x1="13.2" y1="4.8" x2="14.4" y2="3.6" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 10.8A6 6 0 1 1 7.2 3.5a5 5 0 0 0 7.3 7.3z" />
        </svg>
      )}
    </button>
  );
}
