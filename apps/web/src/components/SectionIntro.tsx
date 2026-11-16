import { useState } from "react";
import { dismissSectionIntro, wasSectionIntroDismissed } from "../lib/sectionIntroTriggers";

type SectionIntroColors = {
  bg: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
};

const DEFAULT_COLORS: SectionIntroColors = {
  bg: "var(--surface)",
  border: "var(--border)",
  text: "var(--text)",
  textMuted: "var(--text-2)",
  accent: "var(--accent)",
  accentSoft: "var(--accent-soft)",
};

/**
 * Resumen de "qué es, cómo se usa, qué ganás" — una por sección, debajo del
 * título de cada página. Expandido la primera vez; "Entendido" lo colapsa a
 * un link chico que lo vuelve a abrir (nunca desaparece del todo, ver
 * lib/sectionIntroTriggers.ts). Por defecto usa las variables del tema; las
 * páginas con paleta propia fija (hoy solo MicroActions.tsx) pasan sus
 * propios hex por `colors`.
 */
export function SectionIntro({
  id,
  purpose,
  steps,
  benefit,
  colors = DEFAULT_COLORS,
  startCollapsed = false,
}: {
  id: string;
  purpose: string;
  steps: string[];
  benefit: string;
  colors?: SectionIntroColors;
  /** Empieza siempre colapsado (como ícono/link chico), sin importar si ya se descartó antes — para cuando vive pegado a un título en vez de ocupar su propio bloque (ver Dashboard.tsx). */
  startCollapsed?: boolean;
}) {
  const [dismissed, setDismissed] = useState(() => startCollapsed || wasSectionIntroDismissed(id));

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        className="self-start text-xs font-semibold"
        style={{ color: colors.accent }}
      >
        ¿Qué es esta sección?
      </button>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-4"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <p className="text-sm" style={{ color: colors.text }}>
        {purpose}
      </p>
      <ol className="flex flex-col gap-1.5">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: colors.textMuted }}>
            <span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: colors.accentSoft, color: colors.accent }}
            >
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <p className="text-sm font-semibold" style={{ color: colors.accent }}>
        {benefit}
      </p>
      <button
        type="button"
        onClick={() => {
          dismissSectionIntro(id);
          setDismissed(true);
        }}
        className="self-start rounded-lg px-3 py-1.5 text-xs font-bold"
        style={{ background: colors.accentSoft, color: colors.accent }}
      >
        Entendido, no mostrar más
      </button>
    </div>
  );
}
