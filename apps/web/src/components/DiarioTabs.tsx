import { DIARIO_SECTION_COLORS, type DiarioSection } from "../domain";
import { NEURAL_CYAN, NEURAL_TEXT } from "./NeuralCore/tokens";

const SECTIONS: DiarioSection[] = ["emotion", "knowledge", "gratitude", "flow"];
const SECTION_LABELS: Record<DiarioSection, string> = {
  emotion: "Registro emocional",
  knowledge: "Conocimientos",
  gratitude: "Gratitud",
  flow: "Flow",
};

/**
 * Pestañas del Diario (mockups 17-17g): pastilla con un punto del color de
 * cada sección, la activa en cian con texto oscuro, " ✓" cuando esa sección
 * ya tiene un registro hoy. Sin flechas ‹ › (pedido explícito, a diferencia
 * de SectionPager.tsx que siguen usando Hábitos/Biblioteca) — con solo 4
 * pestañas fijas no hace falta paginar, y en mobile hace scroll horizontal.
 */
export function DiarioTabs({
  active,
  onChange,
  hasEntryToday,
}: {
  active: DiarioSection;
  onChange: (section: DiarioSection) => void;
  hasEntryToday: Record<DiarioSection, boolean>;
}) {
  return (
    <div
      role="tablist"
      aria-label="Sección del diario"
      className="flex w-full gap-1 overflow-x-auto rounded-full p-1 sm:w-fit"
      style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {SECTIONS.map((section) => {
        const isActive = section === active;
        const color = DIARIO_SECTION_COLORS[section];
        return (
          <button
            key={section}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(section)}
            className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold whitespace-nowrap"
            style={{ background: isActive ? NEURAL_CYAN : "transparent", color: isActive ? "#070B1F" : NEURAL_TEXT }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
            {SECTION_LABELS[section]}
            {hasEntryToday[section] && " ✓"}
          </button>
        );
      })}
    </div>
  );
}
