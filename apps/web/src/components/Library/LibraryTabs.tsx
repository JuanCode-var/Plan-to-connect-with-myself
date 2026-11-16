import { NEURAL_FONT_BODY } from "../NeuralCore/tokens";

export type LibraryTab = "PARA_TI" | "LIBROS" | "FRASES" | "FILOSOFIAS";

const TABS: Array<{ key: LibraryTab; label: string }> = [
  { key: "PARA_TI", label: "Para ti" },
  { key: "LIBROS", label: "Libros" },
  { key: "FRASES", label: "Frases" },
  { key: "FILOSOFIAS", label: "Filosofías" },
];

/** Pestañas en píldora (Fase 1, punto 2) — cambian el contenido, no lo apilan. */
export function LibraryTabs({ active, onChange }: { active: LibraryTab; onChange: (tab: LibraryTab) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Secciones de la Biblioteca">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 999,
              fontFamily: NEURAL_FONT_BODY,
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
              background: isActive ? "#22D3EE" : "transparent",
              color: isActive ? "#070B1F" : "#FFFFFF",
              border: isActive ? "none" : "1px solid rgba(255,255,255,0.14)",
              transition: "background .2s ease-out, color .2s ease-out",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
