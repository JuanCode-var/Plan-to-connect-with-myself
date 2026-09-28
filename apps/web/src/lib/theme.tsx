import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext, readStoredTheme, THEME_STORAGE_KEY, type Theme } from "./themeContext";

/**
 * Única fuente de verdad del tema oscuro/claro para toda la app (sidebar,
 * nav móvil y /dashboard, ver diseño "Impulso + Clínico" en
 * mockups/dashboard-direccion-impulso-clinico.html). Se refleja en
 * `document.documentElement.dataset.theme`, que es lo que leen las
 * variables CSS de `index.css`, y se persiste en localStorage. Un contexto
 * en vez de un hook con estado propio en cada componente: así el sidebar y
 * los gráficos de /dashboard siempre ven el mismo valor al alternar.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ver nota en readStoredTheme
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
