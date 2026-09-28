import { createContext } from "react";

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "dr-axon-theme";

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage puede no estar disponible (modo privado, cuotas, etc.);
    // se recae en el tema oscuro por defecto sin romper la app.
  }
  return "dark";
}

export type ThemeContextValue = { theme: Theme; toggleTheme: () => void };

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
