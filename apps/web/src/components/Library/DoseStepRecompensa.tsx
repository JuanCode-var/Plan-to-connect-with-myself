import { useState } from "react";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_FONT_READING } from "../NeuralCore/tokens";

function LockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
    </svg>
  );
}

/** Paso 4 · TU RECOMPENSA — carta de 330px, voltea en 3D al tocarla y desbloquea de verdad (onReveal llama a POST /doses/:id/unlock-reward). */
export function DoseStepRecompensa({
  quoteContent,
  quoteAuthor,
  unlockedCount,
  totalQuotes,
  onReveal,
  onComplete,
}: {
  quoteContent: string;
  quoteAuthor: string | null;
  unlockedCount: number;
  totalQuotes: number;
  onReveal: () => void;
  onComplete: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const quoteFontSize = quoteContent.length > 120 ? 21 : 23;

  function reveal() {
    if (flipped) return;
    setFlipped(true);
    onReveal();
    onComplete();
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 15, color: "#E6E9F5", textAlign: "center" }}>
        Desbloqueaste una frase para tu colección.
      </span>

      <div style={{ width: 330, height: 220, perspective: 1200 }}>
        <button
          type="button"
          onClick={reveal}
          aria-label={flipped ? "Frase revelada" : "Tocar para revelar la frase"}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: flipped ? "default" : "pointer",
            transformStyle: "preserve-3d",
            transition: "transform .8s cubic-bezier(.2,.7,.3,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl"
            style={{
              backfaceVisibility: "hidden",
              background:
                "repeating-linear-gradient(135deg, rgba(167,139,250,0.14) 0 14px, rgba(167,139,250,0.22) 14px 28px), #1A1438",
              border: "1px solid rgba(167,139,250,0.4)",
            }}
          >
            <LockIcon />
            <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, fontWeight: 600, color: "#C4B5FD" }}>
              Toca para revelar · Frase {unlockedCount + 1} de {totalQuotes}
            </span>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "#1A1438",
              border: "1px solid rgba(167,139,250,0.4)",
              padding: 28,
            }}
          >
            <p className="m-0" style={{ fontFamily: NEURAL_FONT_READING, fontStyle: "italic", fontSize: quoteFontSize, lineHeight: 1.4, color: "#FFFFFF", textAlign: "center" }}>
              “{quoteContent}”
            </p>
            {quoteAuthor && (
              <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 13, fontWeight: 700, color: "#C4B5FD" }}>— {quoteAuthor}</span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
