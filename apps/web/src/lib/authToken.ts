// Almacenamiento del token de sesión, aislado en su propio módulo sin más
// imports: tanto api/client.ts (para adjuntarlo a cada request) como
// lib/auth.tsx (para el estado de sesión) lo necesitan, y así ninguno de
// los dos depende del otro.
const TOKEN_KEY = "dr-axon-token";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage puede no estar disponible (modo privado, cuotas, etc.).
  }
}
