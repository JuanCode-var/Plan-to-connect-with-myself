import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";

export function ResonanceHeader({
  cycleNumber,
  currentDay,
  totalDays,
}: {
  cycleNumber: number | null;
  currentDay: number;
  totalDays: number;
}) {
  const progressPct = totalDays > 0 ? Math.min(100, (currentDay / totalDays) * 100) : 0;
  const daysAhead = Math.max(0, totalDays - currentDay);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <h1 style={{ margin: 0, fontFamily: NEURAL_FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: "#FFFFFF" }}>
        Resumen de hábitos
      </h1>
      <span
        style={{
          fontFamily: NEURAL_FONT_BODY,
          fontSize: 13,
          fontWeight: 600,
          color: "#22D3EE",
          padding: "6px 12px",
          borderRadius: 999,
          border: "1px solid rgba(34,211,238,0.45)",
          background: "rgba(34,211,238,0.06)",
          whiteSpace: "nowrap",
        }}
      >
        Ciclo {cycleNumber ?? "—"} · día {currentDay} de {totalDays}
      </span>
      <div className="relative min-w-[120px] flex-1" style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: 6,
            borderRadius: 3,
            width: `${progressPct}%`,
            background: "linear-gradient(90deg, #22D3EE, #A78BFA)",
            transition: "width .5s ease",
          }}
        />
      </div>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY, whiteSpace: "nowrap" }}>
        {daysAhead} {daysAhead === 1 ? "día por delante" : "días por delante"}
      </span>
    </div>
  );
}
