import { NEURAL_FONT_BODY, NEURAL_LAVENDER, NEURAL_TEXT_SOFT, scale } from "./tokens";

function SparkleIcon() {
  return (
    <svg width={scale(14)} height={scale(14)} viewBox="0 0 20 20" fill="none" stroke="#C4B5FD" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 2v4M10 14v4M2 10h4M14 10h4M4.9 4.9l2.1 2.1M13 13l2.1 2.1M15.1 4.9 13 7M7 13l-2.1 2.1" />
    </svg>
  );
}

function insightText(totalToday: number, doneToday: number, altaPendingCount: number): string {
  if (totalToday === 0) return "Todavía no tienes hábitos para hoy — cuando agregues uno, el núcleo empieza a trackearlo.";
  if (doneToday === totalToday) return `Día cerrado: ${totalToday}/${totalToday}. Tu núcleo está a plena carga.`;
  if (altaPendingCount > 0) {
    return `Te faltan ${altaPendingCount} hábito${altaPendingCount === 1 ? "" : "s"} de prioridad alta. Cada uno envía 3 impulsos al núcleo.`;
  }
  const remaining = totalToday - doneToday;
  return `Prioridad alta completa. Quedan ${remaining} para cerrar el día.`;
}

export function InsightCard({
  totalToday,
  doneToday,
  altaPendingCount,
  onViewPending,
}: {
  totalToday: number;
  doneToday: number;
  altaPendingCount: number;
  onViewPending: string;
}) {
  return (
    <div
      style={{
        padding: `${scale(20)}px ${scale(22)}px`,
        borderRadius: scale(18),
        background: "linear-gradient(160deg, rgba(124,92,255,.18), rgba(34,211,238,.06))",
        border: `1px solid rgba(167,139,250,.35)`,
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: scale(10) }}>
        <SparkleIcon />
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
          INSIGHT IA
        </span>
      </div>
      <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(16), lineHeight: 1.5, color: NEURAL_TEXT_SOFT }}>
        {insightText(totalToday, doneToday, altaPendingCount)}
      </p>
      <a
        href={onViewPending}
        className="inline-block"
        style={{ marginTop: scale(10), fontFamily: NEURAL_FONT_BODY, fontSize: scale(14), fontWeight: 600, color: "#22D3EE" }}
      >
        Ver pendientes →
      </a>
    </div>
  );
}
