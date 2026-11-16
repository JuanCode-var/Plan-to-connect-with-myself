import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { useCompass } from "../api/compass";
import { hasSeenWelcomeToday } from "../lib/welcomeSeen";

/**
 * Puerta de entrada de las vistas de la app: sin sesión, redirige a /login
 * guardando la ruta pedida para volver ahí después de iniciar sesión (ver
 * Login.tsx). Antes del chequeo diario de Welcome, un gate que corre UNA
 * sola vez por cuenta (no por día): si todavía no completó el cuestionario
 * obligatorio de "Mi Identidad" (identityOnboardingCompletedAt null — ver
 * Brujula.tsx/CompassOnboarding.tsx), no hay forma de llegar a ninguna otra
 * vista hasta terminarlo. Pedido explícito del usuario: "lo primero que
 * veas" después de registrarte.
 */
export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const { data: compass, isLoading: compassLoading } = useCompass();
  const location = useLocation();

  if (isLoading || (user && compassLoading)) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-sm"
        style={{ background: "var(--bg)", color: "var(--text-2)" }}
      >
        Cargando…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const identityIncomplete = !compass || !compass.identityOnboardingCompletedAt;
  if (identityIncomplete && location.pathname !== "/identidad") {
    return <Navigate to="/identidad" replace />;
  }

  if (!identityIncomplete && !hasSeenWelcomeToday() && location.pathname !== "/welcome") {
    return <Navigate to="/welcome" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
