import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HABIT_PRIORITY_COLORS, HABIT_PRIORITY_LEVELS } from "../domain";
import type { CycleSummary } from "../api/dashboard";
import { useTheme } from "../lib/useTheme";
import { CHART_COLORS } from "../lib/chartTheme";

const PRIORITY_LABELS = { ALTA: "Prioridad alta", MEDIA: "Prioridad media", BAJA: "Prioridad baja" };

// Alto fijo por fila + un piso para pocos hábitos: con 24 hábitos reales en
// la cuenta, un alto fijo quedaba o muy apretado (barras verticales) o con
// las filas superpuestas (horizontales sin esto). Con esto el gráfico crece
// con la cantidad de hábitos en vez de aplastarlos.
const ROW_HEIGHT = 28;
const MIN_HEIGHT = 220;

function truncateName(name: string, max = 32): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

/**
 * Barras de % de cumplimiento por hábito, HORIZONTALES (nombre a la
 * izquierda, barra creciendo a la derecha) — antes eran verticales con los
 * nombres rotados -35°, que con pocos hábitos cortos se leía bien pero con
 * 24 hábitos reales (algunos con nombres largos) quedaba ilegible: texto
 * superpuesto y cortado a mitad de palabra. Horizontal es el layout
 * estándar para muchas categorías con nombres largos — se lee de corrido,
 * sin inclinar la cabeza.
 *
 * El color de cada barra sale del campo `priority` del hábito
 * (`HABIT_PRIORITY_COLORS`, ver domain.ts) — independiente de su categoría
 * (área de vida) — los mismos 3 colores que PriorityIcon y los anillos de
 * TodayProgress, así "Cero apuestas" y "Cero alcohol" se destacan en rojo
 * (prioridad alta) automáticamente. El resto del gráfico (grilla, ejes,
 * tooltip) sí sigue el tema claro/oscuro.
 */
export function HabitCompletionBarChart({ byHabit }: { byHabit: CycleSummary["byHabit"] }) {
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme];

  const data = byHabit.map((habit) => ({
    name: habit.name,
    shortName: truncateName(habit.name),
    percent: Math.round(habit.completionRate * 100),
    priority: habit.priority,
  }));

  const chartHeight = Math.max(MIN_HEIGHT, data.length * ROW_HEIGHT);

  return (
    <div className="flex flex-col gap-3">
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 11, fill: colors.text2 }}
              stroke={colors.border}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              width={168}
              interval={0}
              tick={{ fontSize: 11, fill: colors.text2 }}
              stroke={colors.border}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Cumplimiento"]}
              labelFormatter={(_label, payload) => payload?.[0]?.payload?.name ?? _label}
              contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8 }}
              labelStyle={{ color: colors.text }}
              itemStyle={{ color: colors.text }}
              cursor={{ fill: colors.border, opacity: 0.25 }}
            />
            <Bar dataKey="percent" radius={[0, 4, 4, 0]} barSize={14}>
              {data.map((entry) => {
                const color = HABIT_PRIORITY_COLORS[entry.priority];
                return <Cell key={entry.name} fill={color} className="chart-glow" style={{ color }} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {HABIT_PRIORITY_LEVELS.map((level) => (
          <div key={level} className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.text2 }}>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: HABIT_PRIORITY_COLORS[level] }}
            />
            {PRIORITY_LABELS[level]}
          </div>
        ))}
      </div>
    </div>
  );
}
