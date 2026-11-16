import { NEURAL_CYAN, NEURAL_FONT_READING, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { EmptyState, PhaseLabel } from "./PhaseFields";
import { HoldButton } from "./HoldButton";

function firstSentence(text: string): string {
  const match = /^[^.!?]+[.!?]?/.exec(text.trim());
  return (match ? match[0] : text).trim();
}

/** "Nuevas creencias empoderadoras" (Valores fase 4) — ritual de mantener para activar la ruta nueva (mockup 18g), una vez por día. */
export function ReprogramPhase({
  limitingBeliefs,
  empoweringBeliefs,
  reprogrammedToday,
  onComplete,
  editing,
  draft,
  onDraftChange,
  onStartEdit,
}: {
  limitingBeliefs: string;
  empoweringBeliefs: string;
  reprogrammedToday: boolean;
  onComplete: () => void;
  editing: boolean;
  draft: string;
  onDraftChange: (next: string) => void;
  onStartEdit: () => void;
}) {
  if (editing) {
    return (
      <div className="flex flex-col gap-3">
        <PhaseLabel>Nuevas creencias empoderadoras</PhaseLabel>
        <textarea
          autoFocus
          rows={4}
          className="resize-none rounded-xl p-3 font-reading text-lg"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.16)", color: NEURAL_TEXT, fontFamily: NEURAL_FONT_READING, maxWidth: 700 }}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
        />
      </div>
    );
  }

  if (!empoweringBeliefs.trim()) {
    return (
      <div className="flex flex-col gap-3">
        <PhaseLabel>Nuevas creencias empoderadoras</PhaseLabel>
        <EmptyState onWrite={onStartEdit} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PhaseLabel>Nuevas creencias empoderadoras</PhaseLabel>
      {limitingBeliefs.trim() && (
        <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY, textDecoration: "line-through" }}>
          Antes: &ldquo;{firstSentence(limitingBeliefs)}&rdquo;.
        </p>
      )}
      <p className="m-0 font-reading text-2xl leading-snug sm:text-[27px]" style={{ fontFamily: NEURAL_FONT_READING, color: NEURAL_TEXT, maxWidth: 700 }}>
        {empoweringBeliefs}
      </p>

      {reprogrammedToday ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold" style={{ background: NEURAL_CYAN, color: "#070B1F" }}>
            ✓ Ruta nueva activada
          </span>
          <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Léela en voz alta una vez hoy: así la ruta se fortalece.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <HoldButton size={64} icon="→" onComplete={onComplete} />
          <span className="text-sm font-semibold" style={{ color: NEURAL_TEXT }}>
            Mantén para activar la nueva creencia
          </span>
        </div>
      )}
    </div>
  );
}
