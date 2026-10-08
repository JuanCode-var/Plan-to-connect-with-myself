import ReactECharts from "echarts-for-react";
import { HABIT_PRIORITY_COLORS, HABIT_PRIORITY_LEVELS } from "../domain";
import type { CycleSummary } from "../api/dashboard";
import { useTheme } from "../lib/useTheme";
import { CHART_COLORS } from "../lib/chartTheme";
import { echartsAxisStyle, echartsBaseOption } from "../lib/echartsTheme";

const PRIORITY_LABELS = { ALTA: "Prioridad alta", MEDIA: "Prioridad media", BAJA: "Prioridad baja" };

// Alto fijo por fila + un piso para pocos hábitos: con 24+ hábitos reales en
// la cuenta, un alto fijo quedaba o muy apretado o con las filas
// superpuestas. Con esto el gráfico crece según la cantidad de hábitos.
const ROW_HEIGHT = 30;
const MIN_HEIGHT = 220;

// Patrón "emphasis" (skill de dataviz): esta lista no es un reporte, es
// "qué atender hoy" — por debajo de este % la barra toma el color de su
// prioridad (llama la atención); en o por encima, se apaga a gris.
const ATTENTION_THRESHOLD = 50;

function truncateName(name: string, max = 30): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

/** Degradé sutil a lo largo de la barra (de la base al extremo con el dato)
 * — misma técnica que usan los dashboards "premium": el color no es un
 * bloque plano, tiene una leve profundidad. `color` siempre llega en hex. */
function barGradient(color: string) {
  return {
    type: "linear" as const,
    x: 0,
    y: 0,
    x2: 1,
    y2: 0,
    colorStops: [
      { offset: 0, color: `${color}B3` }, // ~70% opacidad en la base
      { offset: 1, color },
    ],
  };
}

/**
 * Barras de % de cumplimiento por hábito, HORIZONTALES (nombre a la
 * izquierda, barra creciendo a la derecha) — con 24+ hábitos y nombres
 * largos, los nombres en diagonal de una barra vertical se pisaban; una
 * grilla de píldoras de HTML plano, por su parte, perdía la señal de orden
 * (la longitud de una barra ES el orden, de un vistazo) y no tenía hover
 * real. Esto vuelve a ser un gráfico de ECharts: tooltip con transición,
 * la fila bajo el cursor se resalta y el resto se atenúa (`emphasis.focus`),
 * y una animación de entrada (las barras crecen desde 0, no aparecen de
 * golpe).
 *
 * Ordenado de PEOR a mejor cumplimiento (no por orden de creación): la
 * pregunta que responde esta pantalla es "¿qué necesito atender hoy?", no
 * "acá está la lista completa" — lo urgente arriba. El color refuerza lo
 * mismo: por debajo de ATTENTION_THRESHOLD toma el color de su `priority`
 * (HABIT_PRIORITY_COLORS, ver domain.ts); en o por encima, gris apagado.
 */
export function HabitCompletionBarChart({ byHabit }: { byHabit: CycleSummary["byHabit"] }) {
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme];
  const axis = echartsAxisStyle(theme);
  const onTrackColor = theme === "dark" ? "#454B59" : "#D9D3C6";
  // ECharts dibuja en <canvas>, que nunca resuelve `var(--...)` (eso solo
  // funciona en estilos de elementos DOM reales) — a diferencia de la
  // leyenda de abajo (sí es DOM), acá no puede usarse HABIT_PRIORITY_COLORS
  // tal cual: su valor MEDIA es literalmente el string "var(--accent)". Se
  // arma una copia con el hex ya resuelto (CHART_COLORS, mismo que usan los
  // demás gráficos) solo para lo que toca el canvas.
  const chartPriorityColors = {
    ALTA: HABIT_PRIORITY_COLORS.ALTA,
    MEDIA: colors.accent,
    BAJA: HABIT_PRIORITY_COLORS.BAJA,
  };

  const data = byHabit
    .map((habit) => ({
      name: habit.name,
      shortName: truncateName(habit.name),
      percent: Math.round(habit.completionRate * 100),
      priority: habit.priority,
    }))
    .sort((a, b) => a.percent - b.percent);

  const chartHeight = Math.max(MIN_HEIGHT, data.length * ROW_HEIGHT);

  const option = {
    ...echartsBaseOption(theme),
    animationEasing: "cubicOut" as const,
    animationDuration: 700,
    grid: { ...echartsBaseOption(theme).grid, left: 4, right: 40 },
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { ...axis.axisLabel, formatter: "{value}%" },
      splitLine: axis.splitLine,
      axisLine: { show: false },
    },
    yAxis: {
      type: "category",
      data: data.map((d) => d.shortName),
      inverse: true,
      ...axis,
      splitLine: { show: false },
    },
    tooltip: {
      ...echartsBaseOption(theme).tooltip,
      axisPointer: { type: "shadow" },
      transitionDuration: 0.25,
      formatter: (params: unknown) => {
        const p = (params as Array<{ dataIndex: number; value: number }>)[0];
        const d = data[p.dataIndex];
        const statusLabel = d.percent < ATTENTION_THRESHOLD ? "necesita atención" : "al día";
        return `${d.name}<br/><strong>${p.value}%</strong> cumplimiento · ${statusLabel}`;
      },
    },
    series: [
      {
        type: "bar",
        data: data.map((d) => {
          const color = d.percent < ATTENTION_THRESHOLD ? chartPriorityColors[d.priority] : onTrackColor;
          return {
            value: d.percent,
            itemStyle: { color: barGradient(color), borderRadius: [0, 4, 4, 0] },
          };
        }),
        barMaxWidth: 16,
        // Al pasar el mouse: la fila se agranda levemente y gana un halo;
        // el resto se atenúa, para que el ojo se concentre en una sola
        // comparación a la vez en vez de las 27 juntas.
        emphasis: {
          focus: "self",
          itemStyle: { shadowBlur: 12, shadowColor: "rgba(0,0,0,0.35)" },
        },
        blur: { itemStyle: { opacity: 0.45 } },
      },
    ],
  };

  return (
    <div className="flex flex-col gap-3">
      <div style={{ height: chartHeight }}>
        <ReactECharts option={option} style={{ height: "100%", width: "100%" }} notMerge />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="text-[11px]" style={{ color: colors.text2 }}>
          Necesita atención (&lt;{ATTENTION_THRESHOLD}%):
        </span>
        {HABIT_PRIORITY_LEVELS.map((level) => (
          <div key={level} className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.text2 }}>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: HABIT_PRIORITY_COLORS[level] }}
            />
            {PRIORITY_LABELS[level]}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.text2 }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: onTrackColor }} />
          Al día (≥{ATTENTION_THRESHOLD}%)
        </div>
      </div>
    </div>
  );
}
