import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchCurrentUser, type AuthUser } from "../api/auth";
import { ApiError } from "../api/client";
import { AuthContext } from "./authContext";
import { getAuthToken, setAuthToken } from "./authToken";

/**
 * Única fuente de verdad de "quién entró" — identifica a la persona para
 * personalizar saludos/copy motivacional (AppShell, TodayProgress,
 * TrackerMatrix) Y para que el backend filtre cada hábito/ciclo/entrada del
 * diario/meta por dueño (ver `requireAuth` middleware en apps/api/src;
 * cada cuenta ve solo lo suyo). Al montar, si hay un token guardado se
 * valida contra GET /api/auth/me; si el token venció o es inválido, se
 * limpia en vez de dejar la app en un estado logueado a medias.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Arranca en `true` solo si hay un token guardado que valga la pena
  // validar; así la rama "sin token" no necesita un setState síncrono
  // dentro del efecto (deriva el estado inicial en vez de despacharlo).
  const [isLoading, setIsLoading] = useState<boolean>(() => getAuthToken() !== null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetchCurrentUser()
      .then((current) => setUser(current))
      .catch((err) => {
        if (err instanceof ApiError) setAuthToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback((token: string, nextUser: AuthUser) => {
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signIn, signOut }),
    [user, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
