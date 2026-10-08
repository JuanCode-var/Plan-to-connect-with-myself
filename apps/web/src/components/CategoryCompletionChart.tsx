import ReactECharts from "echarts-for-react";
import { HABIT_CATEGORIES, HABIT_CATEGORY_LABELS, type HabitCategory } from "../domain";
import type { CycleSummary } from "../api/dashboard";
import { useTheme } from "../lib/useTheme";
import { CHART_COLORS } from "../lib/chartTheme";
import { echartsAxisStyle, echartsBaseOption } from "../lib/echartsTheme";

/**
 * % de cumplimiento PROMEDIO por área de vida (Físico/Económico/Mental/
 * Emocional/Habilidades/Espiritual) — complementa a HabitCompletionBarChart
 * en vez de reemplazarlo: ese responde "¿qué hábito puntual necesito
 * atender?" (ordenado por urgencia, coloreado por prioridad), este responde
 * "¿qué ÁREA de mi vida estoy descuidando en general?". Mezclar ambas
 * preguntas en un solo gráfico (urgencia + prioridad + área a la vez)
 * satura la lectura — por eso quedan separados.
 *
 * Una sola serie (el promedio), un solo hue — igual criterio que
 * CycleComparisonChart: acá el color no necesita distinguir identidad (el
 * eje ya nombra cada área), solo magnitud. Ordenado de peor a mejor
 * promedio para mantener la misma lógica de "lo que más te falta, primero"
 * del resto del Resumen. Las áreas sin ningún hábito todavía no aparecen
 * (mostrar un 0% ahí confundiría "sin datos" con "incumplido").
 */
export function CategoryCompletionChart({ byHabit }: { byHabit: CycleSummary["byHabit"] }) {
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme];
  const axis = echartsAxisStyle(theme);

  const data = HABIT_CATEGORIES.map((category) => {
    const habitsInCategory = byHabit.filter((h) => h.category === category);
    if (habitsInCategory.length === 0) return null;
    const avg = habitsInCategory.reduce((sum, h) => sum + h.completionRate, 0) / habitsInCategory.length;
    return { category, label: HABIT_CATEGORY_LABELS[category], percent: Math.round(avg * 100) };
  })
    .filter((d): d is { category: HabitCategory; label: string; percent: number } => d !== null)
    .sort((a, b) => a.percent - b.percent);

  const option = {
    ...echartsBaseOption(theme),
    xAxis: { type: "category", data: data.map((d) => d.label), ...axis, splitLine: { show: false } },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { ...axis.axisLabel, formatter: "{value}%" },
      splitLine: axis.splitLine,
      axisLine: { show: false },
    },
    tooltip: {
      ...echartsBaseOption(theme).tooltip,
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const p = (params as Array<{ name: string; value: number }>)[0];
        return `${p.name}<br/><strong>${p.value}%</strong> cumplimiento promedio`;
      },
    },
    series: [
      {
        type: "bar",
        data: data.map((d) => d.percent),
        barMaxWidth: 48,
        itemStyle: { color: colors.accent, borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  return (
    <div className="h-64 w-full sm:h-72">
      <ReactECharts option={option} style={{ height: "100%", width: "100%" }} notMerge />
    </div>
  );
}
