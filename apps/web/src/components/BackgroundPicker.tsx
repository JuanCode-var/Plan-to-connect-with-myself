import type { BackgroundScene } from "../lib/backgroundContext";

const OPTIONS: Array<{ value: BackgroundScene; label: string }> = [
  { value: "stars", label: "Estrellas" },
  { value: "space", label: "Espacio" },
  { value: "snow", label: "Nieve" },
];

function SceneIcon({ scene }: { scene: BackgroundScene }) {
  if (scene === "stars") {
    return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2l1.6 4.9L17 8l-4.4 3.2L14 17l-4-3-4 3 1.4-5.8L3 8l5.4-1.1L10 2z" />
      </svg>
    );
  }
  if (scene === "space") {
    return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2c2.5 2 3.8 5 3.8 8.2 0 2-1 3.8-1 3.8h-5.6s-1-1.8-1-3.8C6.2 7 7.5 4 10 2z" />
        <circle cx="10" cy="9" r="1.4" />
        <path d="M6.5 13l-2 3.5M13.5 13l2 3.5" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="10" y1="2" x2="10" y2="18" />
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="4.8" y1="4.8" x2="15.2" y2="15.2" />
      <line x1="15.2" y1="4.8" x2="4.8" y2="15.2" />
    </svg>
  );
}

/**
 * Selector de la escena de fondo animado, vive en ProfileMenu junto al
 * toggle de tema. Las 3 opciones (estrellas / espacio / nieve) están siempre
 * disponibles a la vez — no hay una "recomendada" fija, elige el usuario.
 */
export function BackgroundPicker({
  scene,
  onChange,
}: {
  scene: BackgroundScene;
  onChange: (scene: BackgroundScene) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {OPTIONS.map((opt) => {
        const active = opt.value === scene;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-label={`Fondo: ${opt.label}`}
            aria-pressed={active}
            title={opt.label}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] border transition-colors"
            style={{
              background: active ? "var(--accent-soft)" : "var(--surface)",
              borderColor: active ? "var(--accent)" : "var(--border)",
              color: active ? "var(--accent)" : "var(--text-2)",
            }}
          >
            <SceneIcon scene={opt.value} />
          </button>
        );
      })}
    </div>
  );
}
