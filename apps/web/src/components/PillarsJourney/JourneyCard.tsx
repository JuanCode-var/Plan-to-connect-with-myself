import type { ReactNode } from "react";
import { NEURAL_CYAN, NEURAL_FONT_READING, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import type { PillarMeta } from "./pillarsJourneyShared";

const TOTAL_PHASES = 4;

export function JourneyCard({
  pillar,
  phase,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  editing,
  onToggleEdit,
  pendingPillars,
  children,
}: {
  pillar: PillarMeta;
  phase: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  editing?: boolean;
  onToggleEdit?: () => void;
  pendingPillars: PillarMeta[];
  children: ReactNode;
}) {
  const toneBg = pillar.tone.replace("rgb", "rgba").replace(")", ",0.1)");
  const toneBorder = pillar.tone.replace("rgb", "rgba").replace(")", ",0.3)");
  const toneGlyphBg = pillar.tone.replace("rgb", "rgba").replace(")", ",0.18)");

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 880 }}>
      {pendingPillars.map((p, i) => (
        <div
          key={p.key}
          aria-hidden
          className="absolute right-0 left-0 mx-auto rounded-[20px]"
          style={{
            top: 14 + i * 24,
            height: 60,
            maxWidth: 880 - (i + 1) * 28,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
            opacity: 0.6 - i * 0.2,
            zIndex: -1 - i,
          }}
        >
          <span
            className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-semibold"
            style={{ color: NEURAL_TEXT_SECONDARY }}
          >
            {p.name}
          </span>
        </div>
      ))}

      <div
        className="relative flex flex-col gap-6 rounded-[28px] p-7 sm:p-9"
        style={{ background: `linear-gradient(160deg, ${toneBg}, rgba(7,11,31,0.6))`, border: `1px solid ${toneBorder}`, boxShadow: "0 24px 60px rgba(0,0,0,.45)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
              style={{ background: toneGlyphBg, color: pillar.tone }}
              aria-hidden
            >
              {pillar.glyph}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-lg font-bold" style={{ color: NEURAL_TEXT }}>
                {pillar.name}
              </span>
              <span className="text-sm italic" style={{ fontFamily: NEURAL_FONT_READING, color: "#C4B5FD" }}>
                {pillar.question}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_TEXT_SECONDARY, letterSpacing: "1.5px" }}>
              Fase {phase} de {TOTAL_PHASES}
            </span>
            {onToggleEdit && (
              <button
                type="button"
                onClick={onToggleEdit}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                style={{ borderColor: "rgba(34,211,238,.35)", color: NEURAL_CYAN }}
              >
                {editing ? "Listo" : "✎ Editar"}
              </button>
            )}
          </div>
        </div>

        <div className="min-h-[220px]">{children}</div>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={phase === 1}
            aria-label="Fase anterior"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border disabled:opacity-30"
            style={{ borderColor: "rgba(34,211,238,.35)", color: NEURAL_CYAN }}
          >
            ←
          </button>

          <div className="flex flex-1 items-center justify-center gap-1.5">
            {Array.from({ length: TOTAL_PHASES }, (_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full"
                style={{ width: i + 1 === phase ? 32 : 20, background: i + 1 <= phase ? NEURAL_CYAN : "rgba(255,255,255,0.14)" }}
              />
            ))}
            <span className="ml-1 h-2.5 w-2.5 rotate-45" style={{ border: "1.5px solid rgba(196,181,253,.6)" }} aria-hidden />
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="shrink-0 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-40"
            style={{ background: NEURAL_CYAN, color: "#070B1F" }}
          >
            {nextLabel}
          </button>
        </div>
      </div>

      <p className="mt-5 text-center text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Lee despacio. Una idea a la vez.
      </p>
    </div>
  );
}
