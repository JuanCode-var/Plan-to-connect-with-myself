import { NEURAL_CYAN, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { PhaseLabel } from "./PhaseFields";

const ACTION_OPTIONS = ["Compartir con alguien algo que aprendí", "Escribir un mensaje que motive a alguien", "Aprender algo nuevo durante 20 minutos"];

/** "Tu propósito, hoy" (Propósito fase 4) — elegir una acción concreta crea una MicroAction real (mockup 18h). */
export function PurposeActionPhase({ selectedText, onSelect }: { selectedText: string | null; onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <PhaseLabel>Tu propósito, hoy</PhaseLabel>
      <p className="m-0 text-sm italic" style={{ color: "#C4B5FD" }}>
        ¿Qué harás hoy que se parezca a este propósito?
      </p>
      <div className="flex flex-col gap-2.5">
        {ACTION_OPTIONS.map((text) => {
          const isSelected = selectedText === text;
          return (
            <button
              key={text}
              type="button"
              onClick={() => onSelect(text)}
              className="flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-semibold"
              style={isSelected ? { background: NEURAL_CYAN, color: "#070B1F" } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.14)", color: NEURAL_TEXT }}
            >
              <span>{text}</span>
              <span className="shrink-0 text-xs font-bold">{isSelected ? "✓ Agregada" : "+"}</span>
            </button>
          );
        })}
      </div>
      {selectedText && (
        <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Agregada a tus micro acciones de hoy. Tu propósito ya tiene una acción concreta.
        </p>
      )}
    </div>
  );
}
