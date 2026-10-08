import ReactECharts from "echarts-for-react";
import type { CycleComparisonEntry } from "../api/dashboard";
import { useTheme } from "../lib/useTheme";
import { CHART_COLORS } from "../lib/chartTheme";
import { echartsAxisStyle, echartsBaseOption } from "../lib/echartsTheme";

/**
 * Comparación de % de cumplimiento general entre ciclos. `cycles` ya llega
 * ordenado cronológicamente (por `startDate` asc) desde
 * GET /api/dashboard/compare — no se reordena acá. Una sola serie: sin
 * leyenda, barra con tope redondeado (4px) y base cuadrada en 0, nunca más
 * de 24px de ancho aunque haya pocos ciclos.
 */
export function CycleComparisonChart({ cycles }: { cycles: CycleComparisonEntry[] }) {
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme];
  const axis = echartsAxisStyle(theme);

  const names = cycles.map((c) => c.name);
  const percents = cycles.map((c) => Math.round(c.completionRate * 100));

  const option = {
    ...echartsBaseOption(theme),
    xAxis: { type: "category", data: names, ...axis, splitLine: { show: false } },
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
        return `${p.name}<br/><strong>${p.value}%</strong> cumplimiento`;
      },
    },
    series: [
      {
        type: "bar",
        data: percents,
        barMaxWidth: 24,
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
