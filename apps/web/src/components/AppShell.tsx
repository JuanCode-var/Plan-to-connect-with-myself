import type { ComponentType } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../lib/useTheme";
import { useAuth } from "../lib/useAuth";
import { firstName, timeOfDayGreeting, timeOfDayVariant } from "../lib/greeting";
import { ProfileMenu } from "./ProfileMenu";
import { Logo } from "./Logo";
import { TimeOfDayIcon } from "./TimeOfDayIcon";

function IconTracker() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="14" height="14" rx="3" />
      <line x1="3" y1="8.3" x2="17" y2="8.3" />
      <line x1="3" y1="13.6" x2="17" y2="13.6" />
      <path d="M5.3 5.6l0.9 0.9 1.4-1.4" />
    </svg>
  );
}

function IconHabits() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3l7 3.5-7 3.5-7-3.5L10 3z" />
      <path d="M3 10.5l7 3.5 7-3.5" />
      <path d="M3 14l7 3.5 7-3.5" />
    </svg>
  );
}

function IconJournal() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2.5" width="12" height="15" rx="1.5" />
      <line x1="4" y1="6.3" x2="1.6" y2="6.3" />
      <line x1="4" y1="9.3" x2="1.6" y2="9.3" />
      <line x1="4" y1="12.3" x2="1.6" y2="12.3" />
      <line x1="7" y1="6.8" x2="13" y2="6.8" />
      <line x1="7" y1="9.8" x2="13" y2="9.8" />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="17" x2="17" y2="17" />
      <rect x="5" y="10" width="3" height="7" />
      <rect x="9.5" y="6" width="3" height="11" />
      <rect x="14" y="8.5" width="3" height="8.5" />
    </svg>
  );
}

const NAV_ITEMS: Array<{ to: string; label: string; Icon: ComponentType }> = [
  { to: "/tracker", label: "Seguimiento", Icon: IconTracker },
  { to: "/habits", label: "Hábitos", Icon: IconHabits },
  { to: "/journal", label: "Diario", Icon: IconJournal },
  { to: "/dashboard", label: "Resumen", Icon: IconDashboard },
];

/**
 * Shell de navegación compartido por las 4 vistas: sidebar fijo en
 * escritorio, barra de pestañas fija abajo en celular — "flexible a
 * cualquier pantalla" (ver mockups/dashboard-direccion-impulso-clinico.html
 * para la referencia visual). Una barra superior SIEMPRE visible (no solo
 * mobile) lleva el saludo grande a la izquierda y el `ProfileMenu` (avatar +
 * tema + cerrar sesión) a la derecha — la otra esquina de esa misma barra.
 */
export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col md:flex-row" style={{ background: "var(--bg)" }}>
      <aside
        className="hidden w-60 shrink-0 flex-col gap-8 border-r p-5 md:flex"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <Logo />
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className="flex items-center gap-2.5 rounded-[9px] border-l-[3px] px-3 py-2.5 text-[13px] font-semibold tracking-wide uppercase"
              style={({ isActive }) => ({
                borderLeftColor: isActive ? "var(--accent)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-2)",
                background: isActive ? "var(--accent-soft)" : "transparent",
              })}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-8"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="md:hidden">
            <Logo compact />
          </div>

          {user && (
            <div className="flex min-w-0 flex-1 items-center gap-2" style={{ color: "var(--accent)" }}>
              <TimeOfDayIcon variant={timeOfDayVariant()} size={22} />
              <span className="font-display truncate text-lg font-bold sm:text-xl" style={{ color: "var(--text)" }}>
                {timeOfDayGreeting()}, <span style={{ color: "var(--accent)" }}>{firstName(user.name)}</span>
              </span>
            </div>
          )}

          {user && (
            <ProfileMenu user={user} theme={theme} onToggleTheme={toggleTheme} onSignOut={signOut} />
          )}
        </header>

        <main className="min-w-0 flex-1 pb-16 md:pb-0" style={{ background: "var(--bg)", color: "var(--text)" }}>
          <Outlet />
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-10 flex items-stretch justify-around border-t md:hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold tracking-wide uppercase"
              style={({ isActive }) => ({ color: isActive ? "var(--accent)" : "var(--text-2)" })}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
