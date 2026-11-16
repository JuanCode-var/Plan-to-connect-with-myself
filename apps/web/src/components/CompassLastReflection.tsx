import { useState } from "react";
import { useCompassReflections } from "../api/compass";
import { NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

function formatDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("es-AR", { day: "numeric", month: "long" });
}

function sourceLabel(entry: { context: string | null }): string {
  return entry.context?.startsWith("habit_interrupted:") ? "¿Qué se interpuso?" : "Reflexión";
}

/** "Última reflexión" (mockup 13/13b) — la más reciente del diario de reflexiones, con link a verlas todas. */
export function CompassLastReflection() {
  const { data: reflections } = useCompassReflections();
  const [showAll, setShowAll] = useState(false);
  const latest = reflections?.[0];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl p-5" style={{ background: NEURAL_CARD_BG, border: `1px solid ${NEURAL_CARD_BORDER}` }}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold tracking-wide uppercase" style={{ color: "#C4B5FD", letterSpacing: "1.5px" }}>
          Última reflexión
        </span>
        {reflections && reflections.length > 0 && (
          <button type="button" onClick={() => setShowAll(true)} className="text-xs font-semibold" style={{ color: NEURAL_CYAN }}>
            Ver diario →
          </button>
        )}
      </div>

      {latest ? (
        <>
          <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
            {formatDate(latest.date)} · {sourceLabel(latest)}
          </span>
          <p className="m-0 border-l-2 pl-3 font-reading text-base leading-relaxed" style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}>
            {latest.answer}
          </p>
        </>
      ) : (
        <p className="m-0 text-sm italic" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Todavía no tienes reflexiones registradas.
        </p>
      )}

      {showAll && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 overflow-y-auto p-4 pt-12 sm:p-8 sm:pt-20" style={{ background: "rgba(5,5,9,0.78)" }} onClick={() => setShowAll(false)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className="mx-auto mb-10 flex max-w-xl flex-col gap-4 rounded-[20px] p-7"
              style={{ background: "#0B0F28", border: `1px solid ${NEURAL_CARD_BORDER}` }}
            >
              <div className="flex items-center justify-between">
                <h2 className="m-0 text-lg font-bold" style={{ color: NEURAL_TEXT }}>
                  Diario de reflexiones
                </h2>
                <button type="button" onClick={() => setShowAll(false)} aria-label="Cerrar" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  ✕
                </button>
              </div>
              <ul className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
                {(reflections ?? []).map((r) => (
                  <li key={r.id} className="border-l-2 pl-3" style={{ borderColor: NEURAL_CARD_BORDER }}>
                    <p className="m-0 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                      {formatDate(r.date)} · {sourceLabel(r)}
                    </p>
                    <p className="m-0 font-reading text-base leading-relaxed" style={{ color: NEURAL_TEXT }}>
                      {r.answer}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
