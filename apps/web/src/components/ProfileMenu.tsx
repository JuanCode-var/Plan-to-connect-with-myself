import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "../api/auth";
import type { Theme } from "../lib/themeContext";
import type { BackgroundScene } from "../lib/backgroundContext";
import { ThemeToggle } from "./ThemeToggle";
import { BackgroundPicker } from "./BackgroundPicker";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Avatar con iniciales que abre un dropdown con los datos de la cuenta, el
 * toggle de tema y "Cerrar sesión" — reemplaza los controles sueltos que
 * antes vivían al pie del sidebar, todo en un solo lugar (la esquina
 * opuesta al logo en la barra superior).
 */
export function ProfileMenu({
  user,
  theme,
  onToggleTheme,
  backgroundScene,
  onBackgroundSceneChange,
  onSignOut,
}: {
  user: AuthUser;
  theme: Theme;
  onToggleTheme: () => void;
  backgroundScene: BackgroundScene;
  onBackgroundSceneChange: (scene: BackgroundScene) => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  const avatarStyle = { background: "var(--accent)", color: "var(--accent-ink)" };

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Cuenta"
        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
        style={avatarStyle}
      >
        {initials(user.name)}
      </button>

      {open && (
        <div
          className="absolute right-0 z-30 mt-2 w-56 rounded-xl border p-3 shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="mb-2 flex items-center gap-2.5 border-b pb-2.5" style={{ borderColor: "var(--border)" }}>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={avatarStyle}
            >
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                {user.name}
              </div>
              <div className="truncate text-xs" style={{ color: "var(--text-2)" }}>
                {user.email}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs" style={{ color: "var(--text-2)" }}>
              Tema {theme === "dark" ? "oscuro" : "claro"}
            </span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>

          <div className="flex items-center justify-between border-t py-1.5" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--text-2)" }}>
              Fondo animado
            </span>
            <BackgroundPicker scene={backgroundScene} onChange={onBackgroundSceneChange} />
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="mt-1 w-full rounded-lg border px-3 py-1.5 text-left text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
