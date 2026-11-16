import { useState } from "react";
import { NEURAL_BG, NEURAL_CYAN, NEURAL_GOLD, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

const DURATIONS = [1, 2, 3, 6] as const;
type Duration = (typeof DURATIONS)[number];

const BADGE: Partial<Record<Duration, string>> = { 1: "Mínimo", 3: "Recomendado" };

const NEURO_TEXT: Record<Duration, string> = {
  1: "Un mes es el mínimo: menos tiempo es una prueba, no una palabra. Si estás empezando, firma 1 mes y renuévalo al cerrarlo.",
  2: "Dos meses te dan un primer cierre para ajustar y un segundo para demostrar que puedes sostenerlo.",
  3: "En promedio, un hábito tarda unos 66 días en volverse automático. Con 3 meses le das margen para consolidarse.",
  6: "Seis meses es un compromiso de identidad. Tendrás 6 cierres: cada uno será un sello que suma peso a tu palabra.",
};

/** "¿Cuánto tiempo vas a sostener tu palabra?" (mockup 12e, Paso 1 de 3 del nuevo compromiso) — la duración define el `targetDate` que se le pasa al formulario de redactar (sin cambios). */
export function WordDurationPicker({ onCancel, onContinue }: { onCancel: () => void; onContinue: (months: Duration) => void }) {
  const [months, setMonths] = useState<Duration>(3);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 overflow-y-auto p-4 pt-16 sm:p-8 sm:pt-24" style={{ background: "rgba(5,5,9,0.72)" }} onClick={onCancel}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-[20px] border p-7"
          style={{ background: "#0B0F28", borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: NEURAL_TEXT_SECONDARY, textTransform: "uppercase" }}>
              Nuevo compromiso · paso 1 de 3
            </span>
            <h2 className="m-0 text-xl font-extrabold" style={{ color: NEURAL_TEXT }}>
              ¿Cuánto tiempo vas a sostener tu palabra?
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DURATIONS.map((d) => {
              const selected = d === months;
              const badge = BADGE[d];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setMonths(d)}
                  className="flex flex-col items-center gap-1 rounded-xl border p-3.5"
                  style={selected ? { background: NEURAL_CYAN, borderColor: NEURAL_CYAN, color: "#070B1F" } : { background: "transparent", borderColor: "rgba(255,255,255,0.14)", color: NEURAL_TEXT }}
                >
                  <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 26, fontWeight: 700 }}>{d}</span>
                  <span className="text-sm font-semibold">{d === 1 ? "mes" : "meses"}</span>
                  {badge && (
                    <span className="text-xs font-bold" style={{ color: selected ? "#070B1F" : NEURAL_GOLD }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-start gap-2.5 rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="shrink-0 text-xs font-bold" style={{ color: NEURAL_TEXT_SECONDARY }}>
              🧠 NEURO
            </span>
            <p className="m-0 text-sm" style={{ color: NEURAL_TEXT, lineHeight: 1.5 }}>
              {NEURO_TEXT[months]}
            </p>
          </div>

          <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            {months} {months === 1 ? "mes" : "meses"} = {months} {months === 1 ? "cierre mensual" : "cierres mensuales"}. No tendrás que marcar nada cada día.
          </p>

          <div className="mt-1 flex justify-end gap-2.5">
            <button type="button" onClick={onCancel} className="rounded-xl border px-4 py-2.5 text-sm font-bold" style={{ borderColor: "rgba(34,211,238,.45)", color: NEURAL_CYAN }}>
              Cancelar
            </button>
            <button type="button" onClick={() => onContinue(months)} className="rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: NEURAL_CYAN, color: NEURAL_BG }}>
              Continuar a redactar →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
