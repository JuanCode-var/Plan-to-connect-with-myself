import { Link } from "react-router-dom";
import { NEURAL_FONT_BODY, NEURAL_LAVENDER } from "../NeuralCore/tokens";

/** "TU COLECCIÓN DE FRASES X/N" (Fase 2, columna derecha) — grilla de 10 columnas, desbloqueadas en lavanda, bloqueadas punteadas, la recién desbloqueada con brillo. */
export function DoseQuoteCollectionGrid({
  quoteIds,
  unlockedIds,
  justUnlockedId,
}: {
  quoteIds: string[];
  unlockedIds: Set<string>;
  justUnlockedId: string | null;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
        TU COLECCIÓN DE FRASES {unlockedIds.size} / {quoteIds.length}
      </span>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
        {quoteIds.map((id) => {
          const unlocked = unlockedIds.has(id);
          const justUnlocked = id === justUnlockedId;
          return (
            <span
              key={id}
              style={{
                aspectRatio: "1 / 1",
                borderRadius: 4,
                boxSizing: "border-box",
                background: unlocked ? NEURAL_LAVENDER : "transparent",
                border: unlocked ? "none" : "1px dashed rgba(196,181,253,0.35)",
                boxShadow: justUnlocked ? `0 0 10px ${NEURAL_LAVENDER}` : "none",
              }}
            />
          );
        })}
      </div>
      <Link to="/library" className="text-xs font-semibold" style={{ color: "#22D3EE" }}>
        Ver mi biblioteca completa →
      </Link>
    </div>
  );
}
