import { Link } from "react-router-dom";
import { NEURAL_CYAN, NEURAL_FONT_READING, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

type PillarPreview = { key: string; glyph: string; name: string; question: string; tone: string };

const PILLARS: PillarPreview[] = [
  { key: "autoconocimiento", glyph: "◎", name: "Autoconocimiento", question: "¿Quién soy cuando nadie me lo pide?", tone: "rgb(167,139,250)" },
  { key: "valores", glyph: "◇", name: "Valores", question: "¿Qué defiendo, aunque cueste?", tone: "rgb(129,140,248)" },
  { key: "proposito", glyph: "✦", name: "Propósito", question: "¿Para qué hago todo esto?", tone: "rgb(232,121,249)" },
];

/** "Mi núcleo de identidad · 3 pilares" (mockup 13b) — tarjeta de entrada al recorrido de Autoconocimiento/Valores/Propósito, reemplaza el bloque de pestañas (CompassPillars.tsx, Paso 1 del pedido). */
export function IdentityPillarsEntry() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1.5px" }}>
            Mi núcleo de identidad · 3 pilares
          </span>
          <p className="m-0 text-base italic" style={{ fontFamily: NEURAL_FONT_READING, color: NEURAL_TEXT }}>
            Un recorrido de 5 minutos para leerte con calma, una idea a la vez.
          </p>
        </div>
        <Link
          to="/identidad/nucleo"
          className="shrink-0 rounded-xl px-5 py-3 text-sm font-bold"
          style={{ background: NEURAL_CYAN, color: "#070B1F" }}
        >
          Recorrer mis pilares →
        </Link>
      </div>

      <div className="flex flex-col gap-0 sm:flex-row sm:items-stretch sm:gap-0">
        {PILLARS.map((p, i) => (
          <div key={p.key} className="flex flex-1 items-stretch gap-0">
            <div
              className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl p-4"
              style={{ background: `${p.tone.replace("rgb", "rgba").replace(")", ",0.08)")}`, border: `1px solid ${p.tone.replace("rgb", "rgba").replace(")", ",0.28)")}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                style={{ background: `${p.tone.replace("rgb", "rgba").replace(")", ",0.16)")}`, color: p.tone }}
                aria-hidden
              >
                {p.glyph}
              </span>
              <span className="text-sm font-bold" style={{ color: NEURAL_TEXT }}>
                {p.name}
              </span>
              <span className="text-sm italic" style={{ fontFamily: NEURAL_FONT_READING, color: NEURAL_LAVENDER }}>
                {p.question}
              </span>
              <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                4 fases · umbral al final
              </span>
            </div>
            {i < PILLARS.length - 1 && (
              <div className="hidden w-6 shrink-0 items-center justify-center sm:flex" aria-hidden>
                <div className="h-px w-full" style={{ borderTop: "1px dashed rgba(255,255,255,0.18)" }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
