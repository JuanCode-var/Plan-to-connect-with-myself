import ReactECharts from "echarts-for-react";
import type { CycleSummary } from "../api/dashboard";
import { useTheme } from "../lib/useTheme";
import { CHART_COLORS } from "../lib/chartTheme";
import { echartsAxisStyle, echartsBaseOption } from "../lib/echartsTheme";

function formatDayMonth(dateISO: string): string {
  const [, month, day] = dateISO.split("-");
  return `${day}/${month}`;
}

/**
 * Línea de % de cumplimiento por día. Usa exactamente los días que devuelve
 * el backend (ya recortados a los transcurridos si el ciclo está en curso) —
 * no se vuelve a filtrar ni a rellenar acá. Una sola serie: sin leyenda (el
 * título de la tarjeta ya dice qué se mide), con el tooltip mostrando la
 * fecha completa en vez de la etiqueta corta del eje.
 */
export function DailyTrendLineChart({ byDay }: { byDay: CycleSummary["byDay"] }) {
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme];
  const axis = echartsAxisStyle(theme);

  const labels = byDay.map((d) => formatDayMonth(d.date));
  const dates = byDay.map((d) => d.date);
  const percents = byDay.map((d) => Math.round(d.completionRate * 100));

  const option = {
    ...echartsBaseOption(theme),
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: false,
      ...axis,
      splitLine: { show: false },
    },
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
      axisPointer: { type: "line" },
      formatter: (params: unknown) => {
        const p = (params as Array<{ dataIndex: number; value: number }>)[0];
        return `${dates[p.dataIndex]}<br/><strong>${p.value}%</strong> cumplimiento`;
      },
    },
    series: [
      {
        type: "line",
        data: percents,
        smooth: 0.25,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: { width: 2, color: colors.accent, cap: "round" },
        itemStyle: { color: colors.accent, borderColor: colors.surface, borderWidth: 2 },
        emphasis: { scale: 1.3 },
      },
    ],
  };

  return (
    <div className="h-64 w-full sm:h-72">
      <ReactECharts option={option} style={{ height: "100%", width: "100%" }} notMerge />
    </div>
  );
}
