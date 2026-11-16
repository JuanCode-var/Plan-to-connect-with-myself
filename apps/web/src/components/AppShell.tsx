import type { ComponentType } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../lib/useTheme";
import { useAuth } from "../lib/useAuth";
import { useBackgroundScene } from "../lib/useBackgroundScene";
import { firstName, timeOfDayGreeting, timeOfDayVariant } from "../lib/greeting";
import { ProfileMenu } from "./ProfileMenu";
import { Logo } from "./Logo";
import { TimeOfDayIcon } from "./TimeOfDayIcon";
import { AnimatedBackground } from "./AnimatedBackground";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { ScrollToTopButton } from "./ScrollToTopButton";
import { ToastHost } from "./ToastHost";

function IconWord() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.2" />
      <circle cx="10" cy="10" r="4.3" strokeDasharray="1.2 1.6" />
      <path d="M8.2 10.3l1.3 1.3 2.3-2.8" />
    </svg>
  );
}

function IconCompass() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.2" />
      <path d="M12.6 7.4l-1.8 3.9-3.9 1.8 1.8-3.9 3.9-1.8z" strokeLinejoin="round" />
    </svg>
  );
}

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

function IconGoals() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="3.6" />
      <circle cx="10" cy="10" r="0.6" fill="currentColor" />
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

// Bombilla (idea → acción) — mismo dibujo que el encabezado de
// pages/MicroActions.tsx, en viewBox 24x24 (el resto de los íconos usa
// 20x20; no hace falta compartir viewBox entre íconos sueltos).
function IconMicroActions() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </svg>
  );
}

function IconLibrary() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5c1.8-1 4.2-1 6 0v11c-1.8-1-4.2-1-6 0v-11z" />
      <path d="M17 4.5c-1.8-1-4.2-1-6 0v11c1.8-1 4.2-1 6 0v-11z" />
    </svg>
  );
}

const NAV_ITEMS: Array<{ to: string; label: string; Icon: ComponentType }> = [
  // Primera a propósito: "Mi Palabra" es la sección más importante de la
  // app (pedido explícito del usuario) — el único ítem que encabeza el
  // menú en vez de seguir el orden de "lo que se usa todos los días".
  { to: "/palabra", label: "Mi Palabra", Icon: IconWord },
  { to: "/identidad", label: "Mi Identidad", Icon: IconCompass },
  { to: "/microacciones", label: "Micro acciones", Icon: IconMicroActions },
  { to: "/tracker", label: "Seguimiento", Icon: IconTracker },
  { to: "/metas", label: "Metas", Icon: IconGoals },
  { to: "/habits", label: "Hábitos", Icon: IconHabits },
  { to: "/journal", label: "Diario", Icon: IconJournal },
  { to: "/library", label: "Biblioteca", Icon: IconLibrary },
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
// Pantallas donde el fondo neuronal animado compite visualmente con la red
// propia del Cerebro Interactivo/Mi Mapa Neuronal (pedido explícito, con
// captura) — se oculta ahí para que la red del cerebro se vea sin ruido
// detrás. El resto de la app lo conserva sin cambios.
const ROUTES_WITHOUT_BACKGROUND = ["/tracker", "/mi-mapa-neuronal"];

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { scene, setScene } = useBackgroundScene();
  const location = useLocation();
  const hideBackground = ROUTES_WITHOUT_BACKGROUND.includes(location.pathname);

  return (
    <div className="flex min-h-screen flex-col md:flex-row" style={{ background: "var(--bg)" }}>
      <aside
        className="hidden w-60 shrink-0 flex-col gap-8 border-r p-5 md:flex"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-1">
          <Logo />
          <span
            className="pl-1 text-[10px] font-bold tracking-[0.18em] uppercase"
            style={{ color: "var(--text-2)" }}
          >
            Mejora · Aprende · Evoluciona
          </span>
        </div>
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
            <div className="flex min-w-0 shrink items-center gap-2" style={{ color: "var(--accent)" }}>
              <TimeOfDayIcon variant={timeOfDayVariant()} size={22} />
              <span className="font-display truncate text-lg font-bold sm:text-xl" style={{ color: "var(--text)" }}>
                {timeOfDayGreeting()}, <span style={{ color: "var(--accent)" }}>{firstName(user.name)}</span>
              </span>
            </div>
          )}

          {/* Buscador + campanita + avatar agrupados en un solo item flex:
              así "justify-between" del header reparte el espacio sobrante
              solo entre el saludo y este grupo, no entre cada ícono suelto
              (eso dejaba la campanita lejos del avatar en pantallas anchas). */}
          <div className="flex min-w-0 shrink items-center gap-3">
            <GlobalSearch />

            {user && <NotificationBell />}

            {user && (
              <ProfileMenu
                user={user}
                theme={theme}
                onToggleTheme={toggleTheme}
                backgroundScene={scene}
                onBackgroundSceneChange={setScene}
                onSignOut={signOut}
              />
            )}
          </div>
        </header>

        <main className="relative isolate min-w-0 flex-1 pb-16 md:pb-0" style={{ color: "var(--text)" }}>
          {!hideBackground && <AnimatedBackground scene={scene} />}
          <Outlet />
          <ScrollToTopButton />
          <ToastHost />
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-10 flex items-stretch justify-around border-t md:hidden"
          style={{ background: "var(--surface-solid, var(--surface))", borderColor: "var(--border)" }}
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
