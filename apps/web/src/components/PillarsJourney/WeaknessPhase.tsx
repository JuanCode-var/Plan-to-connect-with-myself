import { useState } from "react";
import { Link } from "react-router-dom";
import { NEURAL_CYAN, NEURAL_GOLD, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { EmptyState, PhaseLabel } from "./PhaseFields";
import type { WeaknessInput } from "../../api/compass";

const fieldStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.16)", color: NEURAL_TEXT };

/** "Lo que estoy trabajando" (Autoconocimiento fase 4) — la debilidad declarada + el peso real de Mi Palabra (meses sellados, ver GET /word/weight — sin pin, nunca un streak diario inventado). */
export function WeaknessPhase({
  weaknesses,
  monthsWeight,
  editing,
  draft,
  onDraftChange,
  onStartEdit,
}: {
  weaknesses: { text: string; counterMessage: string | null }[];
  monthsWeight: number;
  editing: boolean;
  draft: WeaknessInput[];
  onDraftChange: (next: WeaknessInput[]) => void;
  onStartEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const first = weaknesses[0];

  if (editing) {
    return (
      <div className="flex flex-col gap-3">
        <PhaseLabel>Lo que estoy trabajando</PhaseLabel>
        <div className="flex flex-col gap-2">
          {draft.map((w, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <input
                className="rounded-lg p-2 text-sm"
                style={fieldStyle}
                placeholder="Una debilidad concreta"
                value={w.text}
                onChange={(e) => {
                  const next = [...draft];
                  next[i] = { ...next[i], text: e.target.value };
                  onDraftChange(next);
                }}
              />
              <input
                className="rounded-lg p-2 text-xs"
                style={fieldStyle}
                placeholder="Contramensaje (opcional)"
                value={w.counterMessage}
                onChange={(e) => {
                  const next = [...draft];
                  next[i] = { ...next[i], counterMessage: e.target.value };
                  onDraftChange(next);
                }}
              />
            </div>
          ))}
          <button type="button" onClick={() => onDraftChange([...draft, { text: "", counterMessage: "" }])} className="self-start text-xs font-semibold underline" style={{ color: NEURAL_TEXT_SECONDARY }}>
            + Agregar
          </button>
        </div>
      </div>
    );
  }

  if (!first) {
    return (
      <div className="flex flex-col gap-3">
        <PhaseLabel>Lo que estoy trabajando</PhaseLabel>
        <EmptyState onWrite={onStartEdit} />
      </div>
    );
  }

  const fullText = `${first.text}.${first.counterMessage ? ` ${first.counterMessage}` : ""}`;
  const isLong = fullText.length > 180;

  return (
    <div className="flex flex-col gap-3 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${NEURAL_GOLD}` }}>
      <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_GOLD }}>
        Lo que estoy trabajando
      </span>
      <p className={`m-0 text-base ${!expanded && isLong ? "line-clamp-3" : ""}`} style={{ color: NEURAL_TEXT, lineHeight: 1.6 }}>
        <span className="font-bold">{first.text}.</span> {first.counterMessage}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {isLong && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs font-semibold" style={{ color: NEURAL_CYAN }}>
            {expanded ? "Leer menos" : "Leer completo"}
          </button>
        )}
        <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "rgba(255,255,255,0.08)", color: NEURAL_TEXT_SECONDARY }}>
          {monthsWeight} {monthsWeight === 1 ? "mes honrando tu palabra" : "meses honrando tu palabra"}
        </span>
        <Link to="/palabra" className="text-xs font-semibold" style={{ color: NEURAL_CYAN }}>
          Ver mi palabra →
        </Link>
      </div>
    </div>
  );
}
