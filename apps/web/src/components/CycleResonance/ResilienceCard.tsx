import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY } from "../NeuralCore/tokens";
import type { ResilienceResult } from "./eegAnalysis";

function resilienceText(r: ResilienceResult): string {
  if (r.apagonCount === 0) return "Todavía no tuviste ningún apagón este ciclo — nada que recuperar.";
  if (r.avgDays === null) return "Tuviste un apagón, pero todavía no volviste a Enfoque (≥58%) — está en curso.";
  return `Después de un apagón, en promedio vuelves a Enfoque en ${r.avgDays} ${r.avgDays === 1 ? "día" : "días"}.`;
}

/** "Índice de resiliencia" — sección 6 del pedido, texto fijo de la etiqueta preservado tal cual. */
export function ResilienceCard({ resilience }: { resilience: ResilienceResult }) {
  return (
    <div
      className="flex h-full flex-col gap-2"
      style={{ padding: 20, borderRadius: 20, background: "rgba(253,230,138,0.05)", border: "1px solid rgba(253,230,138,0.35)" }}
    >
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: "#FDE68A" }}>
        ÍNDICE DE RESILIENCIA
      </span>
      <div className="flex items-baseline gap-2">
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 44, fontWeight: 700, lineHeight: 1, color: "#FFFFFF" }}>
          {resilience.avgDays ?? "—"}
        </span>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 15, fontWeight: 600, color: "#E6E9F5" }}>
          {resilience.avgDays === 1 ? "día" : "días"} para volver
        </span>
      </div>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, lineHeight: 1.5, color: "#E6E9F5" }}>{resilienceText(resilience)}</span>
      <span className="mt-auto" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, lineHeight: 1.45, color: "#A9B1D6" }}>
        Mide cuánto tardas en volver a Enfoque después de un apagón. No castiga la caída: premia la vuelta.
      </span>
    </div>
  );
}
