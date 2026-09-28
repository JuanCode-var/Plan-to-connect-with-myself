import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CycleSummary } from "../api/dashboard";
import { useTheme } from "../lib/useTheme";
import { CHART_COLORS } from "../lib/chartTheme";

function formatDayMonth(dateISO: string): string {
  const [, month, day] = dateISO.split("-");
  return `${day}/${month}`;
}

/**
 * Línea de % de cumplimiento por día. Usa exactamente los días que devuelve
 * el backend (ya recortados a los transcurridos si el ciclo está en curso) —
 * no se vuelve a filtrar ni a rellenar acá. El eje X y los puntos de la línea
 * salen del mismo arreglo `data`, en el mismo orden, así que nunca se
 * desalinean.
 */
export function DailyTrendLineChart({ byDay }: { byDay: CycleSummary["byDay"] }) {
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme];

  const data = byDay.map((day) => ({
    date: day.date,
    label: formatDayMonth(day.date),
    percent: Math.round(day.completionRate * 100),
  }));

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.text2 }} stroke={colors.border} />
          <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fill: colors.text2 }} stroke={colors.border} />
          <Tooltip
            labelFormatter={(_, payload) =>
              (payload && payload.length > 0 ? payload[0]?.payload?.date : "") ?? ""
            }
            formatter={(value) => [`${value}%`, "Cumplimiento"]}
            contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8 }}
            labelStyle={{ color: colors.text }}
            itemStyle={{ color: colors.text }}
          />
          <Line
            type="monotone"
            dataKey="percent"
            stroke={colors.accent}
            strokeWidth={2.5}
            dot={{ r: 3, fill: colors.accent, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            className="chart-glow"
            style={{ color: colors.accent }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
