import { todayISO } from "./date";

// Aislado en su propio módulo, mismo patrón que authToken.ts: RequireAuth.tsx
// lo lee y Welcome.tsx lo escribe, sin depender uno del otro.
const WELCOME_SEEN_KEY = "dr-axon-welcome-seen-date";

export function hasSeenWelcomeToday(): boolean {
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) === todayISO();
  } catch {
    // localStorage no disponible: no bloquear la app por esto, simplemente
    // se va a mostrar la bienvenida de nuevo (no es un problema grave).
    return false;
  }
}

export function markWelcomeSeenToday(): void {
  try {
    localStorage.setItem(WELCOME_SEEN_KEY, todayISO());
  } catch {
    // ver nota arriba
  }
}
