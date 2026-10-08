import type { EChartsOption } from "echarts";
import type { Theme } from "./themeContext";
import { CHART_COLORS } from "./chartTheme";

/**
 * Piezas de opción de ECharts compartidas por los 4 gráficos del Resumen
 * (HabitCompletionBarChart, CategoryCompletionChart, DailyTrendLineChart,
 * CycleComparisonChart) —
 * mismo criterio que CHART_COLORS: valores hex literales, no `var(--...)`
 * (ECharts tampoco resuelve custom properties de forma confiable). Specs de
 * la skill de dataviz: grilla en líneas sólidas finas (nunca punteadas),
 * recesiva; tooltip con la superficie/borde/texto del tema.
 */
export function echartsBaseOption(theme: Theme): EChartsOption {
  const colors = CHART_COLORS[theme];
  return {
    textStyle: { fontFamily: "Manrope, system-ui, sans-serif" },
    grid: { left: 0, right: 12, top: 12, bottom: 0, containLabel: true },
    axisPointer: { lineStyle: { color: colors.border } },
    tooltip: {
      trigger: "axis",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      textStyle: { color: colors.text, fontSize: 12 },
      padding: [6, 10],
    },
  };
}

/** Eje de categoría/valor recesivo: línea y ticks apagados, grilla sólida fina. */
export function echartsAxisStyle(theme: Theme) {
  const colors = CHART_COLORS[theme];
  return {
    axisLine: { lineStyle: { color: colors.border } },
    axisTick: { show: false },
    axisLabel: { color: colors.text2, fontSize: 11 },
    splitLine: { lineStyle: { color: colors.border, type: "solid" as const, width: 1 } },
  };
}
