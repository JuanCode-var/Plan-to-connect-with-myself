import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { hasSeenWelcomeToday } from "../lib/welcomeSeen";

/**
 * Puerta de entrada de las 4 vistas de la app: sin sesión, redirige a
 * /login guardando la ruta pedida para volver ahí después de iniciar sesión
 * (ver Login.tsx). Mientras se valida el token guardado contra
 * GET /api/auth/me no se decide nada todavía — evita un parpadeo a /login
 * en cada recarga de página.
 */
export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
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

  if (!hasSeenWelcomeToday() && location.pathname !== "/welcome") {
    return <Navigate to="/welcome" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
