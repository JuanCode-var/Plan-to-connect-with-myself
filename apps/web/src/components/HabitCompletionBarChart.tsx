import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HABIT_CATEGORY_COLORS, HABIT_CATEGORY_LABELS, type HabitCategory } from "../domain";
import type { CycleSummary } from "../api/dashboard";
import { useTheme } from "../lib/useTheme";
import { CHART_COLORS } from "../lib/chartTheme";

const LEGEND_CATEGORIES: HabitCategory[] = [
  "PRIORIDAD_MAXIMA",
  "HABITO_BASE",
  "SUPLEMENTO",
  "OPCIONAL",
  "CONDICIONAL",
  "AUTOCONOCIMIENTO",
];

/**
 * Barras de % de cumplimiento por hábito. El color de cada barra sale de
 * `HABIT_CATEGORY_COLORS[category].chipBg` (única fuente de color por
 * categoría) — así "Cero apuestas" y "Cero alcohol" (PRIORIDAD_MAXIMA) se
 * destacan en rojo automáticamente, sin hardcodear esos dos nombres acá. El
 * resto del gráfico (grilla, ejes, tooltip) sí sigue el tema claro/oscuro.
 */
export function HabitCompletionBarChart({ byHabit }: { byHabit: CycleSummary["byHabit"] }) {
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme];

  const data = byHabit.map((habit) => ({
    name: habit.name,
    percent: Math.round(habit.completionRate * 100),
    category: habit.category,
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="min-w-[640px] h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 56 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis
              dataKey="name"
              angle={-35}
              textAnchor="end"
              interval={0}
              height={80}
              tick={{ fontSize: 11, fill: colors.text2 }}
              stroke={colors.border}
            />
            <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fill: colors.text2 }} stroke={colors.border} />
            <Tooltip
              formatter={(value) => [`${value}%`, "Cumplimiento"]}
              contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8 }}
              labelStyle={{ color: colors.text }}
              itemStyle={{ color: colors.text }}
              cursor={{ fill: colors.border, opacity: 0.25 }}
            />
            <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
              {data.map((entry) => {
                const color = HABIT_CATEGORY_COLORS[entry.category].chipBg;
                return <Cell key={entry.name} fill={color} className="chart-glow" style={{ color }} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {LEGEND_CATEGORIES.map((category) => (
          <div key={category} className="flex items-center gap-1.5 text-[11px]" style={{ color: colors.text2 }}>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: HABIT_CATEGORY_COLORS[category].chipBg }}
            />
            {HABIT_CATEGORY_LABELS[category]}
          </div>
        ))}
      </div>
    </div>
  );
}
