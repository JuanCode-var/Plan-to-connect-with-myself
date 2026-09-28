import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CycleComparisonEntry } from "../api/dashboard";
import { useTheme } from "../lib/useTheme";
import { CHART_COLORS } from "../lib/chartTheme";

/**
 * Comparación de % de cumplimiento general entre ciclos. `cycles` ya llega
 * ordenado cronológicamente (por `startDate` asc) desde
 * GET /api/dashboard/compare — no se reordena acá.
 */
export function CycleComparisonChart({ cycles }: { cycles: CycleComparisonEntry[] }) {
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme];

  const data = cycles.map((cycle) => ({
    name: cycle.name,
    percent: Math.round(cycle.completionRate * 100),
  }));

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.text2 }} stroke={colors.border} />
          <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fill: colors.text2 }} stroke={colors.border} />
          <Tooltip
            formatter={(value) => [`${value}%`, "Cumplimiento"]}
            contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8 }}
            labelStyle={{ color: colors.text }}
            itemStyle={{ color: colors.text }}
            cursor={{ fill: colors.border, opacity: 0.25 }}
          />
          <Bar dataKey="percent" fill={colors.accent} radius={[4, 4, 0, 0]} className="chart-glow" style={{ color: colors.accent }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
