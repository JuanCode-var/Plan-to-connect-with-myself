import { Link } from "react-router-dom";
import { NEURAL_BG, NEURAL_CYAN, NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY } from "../NeuralCore/tokens";

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M6 4.5 L15 10 L6 15.5 Z" fill={NEURAL_BG} />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={NEURAL_GOLD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10.5 L8 14.5 L16 5.5" />
    </svg>
  );
}

/**
 * "TU DOSIS DEL DÍA" (Fase 1, punto 3a) — abre la dosis de hoy
 * (useDailyDose.ts, Fase 0 + datos reales). Sin dosis disponible todavía
 * (nada cargado, o el usuario ya hizo la de hoy), se lo dice tal cual en
 * vez de fingir una tarjeta vacía.
 */
export function DoseBanner({
  doseId,
  hookText,
  streak,
  completedToday,
}: {
  doseId: string | null;
  hookText: string | null;
  streak: number;
  completedToday: boolean;
}) {
  if (!doseId || !hookText) return null;

  return (
    <Link
      to={`/library/dosis/${doseId}`}
      className="flex items-center gap-4 rounded-2xl p-5 no-underline"
      style={{
        background: "linear-gradient(110deg, rgba(34,211,238,0.14), rgba(124,92,255,0.14))",
        border: "1px solid rgba(34,211,238,0.4)",
      }}
    >
      <span
        className="flex flex-shrink-0 items-center justify-center rounded-full"
        style={{ width: 52, height: 52, background: completedToday ? "rgba(253,230,138,0.18)" : NEURAL_CYAN }}
      >
        {completedToday ? <CheckIcon /> : <PlayIcon />}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
          TU DOSIS DEL DÍA · 2 MIN
        </span>
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.3 }}>
          {completedToday ? "✓ Dosis de hoy completada" : hookText}
        </span>
        {streak > 0 && (
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, fontWeight: 700, color: "#FDE68A" }}>
            Racha: {streak} {streak === 1 ? "día" : "días"}
          </span>
        )}
      </div>
    </Link>
  );
}
