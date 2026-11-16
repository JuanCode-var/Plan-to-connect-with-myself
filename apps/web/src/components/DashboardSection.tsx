import { useState, type ReactNode } from "react";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 transition-transform duration-200"
      style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
      aria-hidden
    >
      <path d="M5 7.5l5 5 5-5" />
    </svg>
  );
}

/**
 * Envoltorio de sección del Resumen (Mi Palabra / Patrones detectados /
 * Resumen de hábitos): antes las tres eran una sola pila plana de tarjetas,
 * sin ninguna frontera visual entre "esto es tu palabra" y "esto son tus
 * hábitos" — pedido explícito del usuario de separarlas por secciones. Cada
 * una es un bloque propio con encabezado (ícono + título) que se puede
 * colapsar — lo "interactivo" que pidió, y también deja que alguien se
 * enfoque en una sola sección sin scrollear pasado el resto.
 */
export function DashboardSection({
  icon,
  title,
  subtitle,
  defaultOpen = true,
  delay = 0,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  delay?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className="panel-card-in flex flex-col gap-4"
      style={{ animationDelay: `${delay}ms` } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <h2 className="font-display truncate text-base font-bold sm:text-lg" style={{ color: "var(--text)" }}>
              {title}
            </h2>
            {subtitle && (
              <p className="truncate text-xs" style={{ color: "var(--text-2)" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && <div className="panel-expand-in flex flex-col gap-4">{children}</div>}
    </section>
  );
}
