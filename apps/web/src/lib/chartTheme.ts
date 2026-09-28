import type { Theme } from "./themeContext";

/**
 * Recharts renderiza SVG con atributos de presentación directos (stroke=,
 * fill=), que no siempre resuelven `var(--...)` de forma confiable entre
 * navegadores — por eso los gráficos necesitan valores hex literales acá,
 * en vez de leer las custom properties de index.css. Mantené estos valores
 * sincronizados a mano con los `:root` / `:root[data-theme="light"]` de
 * apps/web/src/index.css si cambia la paleta.
 */
export const CHART_COLORS: Record<
  Theme,
  { border: string; text2: string; surface: string; text: string; accent: string }
> = {
  dark: {
    border: "#262B37",
    text2: "#8B90A0",
    surface: "#1B1F29",
    text: "#F2F1ED",
    accent: "#FFB020",
  },
  light: {
    border: "#E6E1D8",
    text2: "#6B7078",
    surface: "#FFFFFF",
    text: "#20242B",
    accent: "#C97C1E",
  },
};
