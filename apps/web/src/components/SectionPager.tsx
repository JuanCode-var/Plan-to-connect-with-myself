import type { ReactNode } from "react";

/**
 * Reemplaza el patrón "todas las secciones en columnas lado a lado" (lo que
 * tenían Hábitos/Biblioteca) y el de "secciones apiladas" (Diario): acá se ve
 * UNA sección a la vez, a todo el ancho, y se pasa a la otra con las flechas
 * o tocando su pestaña — con una transición deslizante ("pasa al otro lado",
 * como pidió el usuario) en vez de scroll vertical largo.
 *
 * Las 3 páginas (Habits.tsx, Library.tsx, Journal.tsx) montan TODOS los
 * paneles a la vez dentro de la pista deslizante (no solo el activo): así
 * cada sección mantiene su propio estado/datos en cache y no hay que volver
 * a pedirlos al servidor cada vez que se cambia de pestaña.
 */
export function SectionPager<T extends string>({
  sections,
  labels,
  active,
  onChange,
  panels,
}: {
  sections: readonly T[];
  labels: Record<T, string>;
  active: T;
  onChange: (section: T) => void;
  panels: Record<T, ReactNode>;
}) {
  const activeIndex = Math.max(0, sections.indexOf(active));
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < sections.length - 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => canPrev && onChange(sections[activeIndex - 1])}
          disabled={!canPrev}
          aria-label="Sección anterior"
          className="shrink-0 rounded-full border px-2.5 py-1.5 text-base font-bold transition-opacity disabled:opacity-30"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          ‹
        </button>

        <div className="flex flex-1 flex-wrap justify-center gap-2">
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => onChange(section)}
              aria-pressed={section === active}
              className="rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors"
              style={{
                background: section === active ? "var(--accent)" : "var(--surface)",
                color: section === active ? "var(--accent-ink)" : "var(--text-2)",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: section === active ? "var(--accent)" : "var(--border)",
              }}
            >
              {labels[section]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => canNext && onChange(sections[activeIndex + 1])}
          disabled={!canNext}
          aria-label="Siguiente sección"
          className="shrink-0 rounded-full border px-2.5 py-1.5 text-base font-bold transition-opacity disabled:opacity-30"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          ›
        </button>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex items-start transition-transform duration-300 ease-out"
          style={{
            width: `${sections.length * 100}%`,
            transform: `translateX(-${activeIndex * (100 / sections.length)}%)`,
          }}
        >
          {sections.map((section) => (
            <div key={section} className="shrink-0 px-0.5" style={{ width: `${100 / sections.length}%` }}>
              {panels[section]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
