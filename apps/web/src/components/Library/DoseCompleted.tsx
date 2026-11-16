import { BRAIN_AREA_LABEL, BRAIN_AREA_RGB, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";

function CheckBadge({ color }: { color: string }) {
  return (
    <span
      className="flex items-center justify-center rounded-full"
      style={{ width: 72, height: 72, background: `rgba(${color},0.15)`, boxShadow: `0 0 30px rgba(${color},0.45)` }}
    >
      <svg width="34" height="34" viewBox="0 0 20 20" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 10.5 L8 14.5 L16 5.5" />
      </svg>
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-3 py-1.5"
      style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, color: "#E6E9F5", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      {children}
    </span>
  );
}

/** Pantalla "DOSIS COMPLETADA" — también la que se ve directo si ya se hizo hoy. */
export function DoseCompleted({
  area,
  microActionText,
  streak,
  unlockedCount,
  totalQuotes,
  nextPreviewText,
  onReplay,
}: {
  area: BrainArea;
  microActionText: string | null;
  streak: number;
  unlockedCount: number;
  totalQuotes: number;
  nextPreviewText: string | null;
  onReplay: () => void;
}) {
  const rgb = BRAIN_AREA_RGB[area];

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <CheckBadge color={rgb} />
      <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: "#FFFFFF" }}>Dosis completada</span>

      {microActionText && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>Tu callo mental de hoy</span>
          <p className="m-0 mt-1" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>{microActionText}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Chip>+1 impulso a {BRAIN_AREA_LABEL[area]}</Chip>
        <Chip>+1 frase {unlockedCount} de {totalQuotes}</Chip>
        <Chip>Racha de {streak} {streak === 1 ? "día" : "días"}</Chip>
      </div>

      {nextPreviewText && (
        <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, lineHeight: 1.5, color: NEURAL_TEXT_SECONDARY, maxWidth: 320 }}>
          {nextPreviewText}
        </p>
      )}

      <button type="button" onClick={onReplay} className="text-sm font-semibold" style={{ color: "#22D3EE" }}>
        Ver de nuevo
      </button>
    </div>
  );
}
