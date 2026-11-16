import { NEURAL_FONT_READING, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";

const fieldStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.16)", color: NEURAL_TEXT };

export function PhaseLabel({ children }: { children: string }) {
  return (
    <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1.5px" }}>
      {children}
    </span>
  );
}

/** Pregunta/afirmación de la fase en Lora, grande — "una idea a la vez" (Paso 2). */
export function PhaseReadingText({ children }: { children: string }) {
  return (
    <p className="m-0 font-reading text-2xl leading-snug sm:text-[27px]" style={{ fontFamily: NEURAL_FONT_READING, color: NEURAL_TEXT, maxWidth: 700 }}>
      {children}
    </p>
  );
}

export function EmptyState({ onWrite }: { onWrite: () => void }) {
  return (
    <button type="button" onClick={onWrite} className="text-left text-base italic" style={{ color: NEURAL_TEXT_SECONDARY }}>
      Aún no has escrito esto. <span style={{ textDecoration: "underline" }}>✎ Escribirlo ahora</span>
    </button>
  );
}

/** Una fase de texto libre simple: label + pregunta + respuesta real (Lora) o estado vacío, con edición en vivo. */
export function TextFieldPhase({
  label,
  question,
  value,
  editing,
  onChange,
  onStartEdit,
}: {
  label: string;
  question: string;
  value: string;
  editing: boolean;
  onChange: (next: string) => void;
  onStartEdit: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <PhaseLabel>{label}</PhaseLabel>
      <p className="m-0 text-sm italic" style={{ color: NEURAL_LAVENDER }}>
        {question}
      </p>
      {editing ? (
        <textarea
          autoFocus
          rows={4}
          className="resize-none rounded-xl p-3 font-reading text-lg"
          style={{ ...fieldStyle, fontFamily: NEURAL_FONT_READING, maxWidth: 700 }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : value.trim() ? (
        <PhaseReadingText>{value}</PhaseReadingText>
      ) : (
        <EmptyState onWrite={onStartEdit} />
      )}
    </div>
  );
}

const CHIP_COLORS = ["#FB5C8C", "#38BDF8", "#FB923C", "#34D399", "#FDE68A", "#A78BFA"];

/** Fase interactiva de "¿cuál usaste/viviste hoy?" — chips tocables que marcan uso diario real (Paso 3: fortalezas/valores). En edición, textarea cruda (una por línea), igual que el editor viejo. */
export function TogglePhase({
  label,
  question,
  items,
  selected,
  onToggle,
  caption,
  editing,
  rawValue,
  onRawChange,
  onStartEdit,
}: {
  label: string;
  question: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  caption: string;
  editing: boolean;
  rawValue: string;
  onRawChange: (next: string) => void;
  onStartEdit: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <PhaseLabel>{label}</PhaseLabel>
      <p className="m-0 text-sm italic" style={{ color: NEURAL_LAVENDER }}>
        {question}
      </p>
      {editing ? (
        <textarea
          autoFocus
          rows={4}
          placeholder="Uno por línea"
          className="resize-none rounded-xl p-3 text-sm"
          style={{ ...fieldStyle, maxWidth: 700 }}
          value={rawValue}
          onChange={(e) => onRawChange(e.target.value)}
        />
      ) : items.length === 0 ? (
        <EmptyState onWrite={onStartEdit} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2.5">
            {items.map((item, i) => {
              const isOn = selected.includes(item);
              const color = CHIP_COLORS[i % CHIP_COLORS.length];
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onToggle(item)}
                  className="rounded-full border px-4 py-2 text-sm font-bold"
                  style={
                    isOn
                      ? { background: "#FDE68A", borderColor: "#FDE68A", color: "#070B1F" }
                      : { background: "transparent", borderColor: color, color }
                  }
                >
                  {isOn ? "✓ " : ""}
                  {item}
                </button>
              );
            })}
          </div>
          <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            {caption}
          </p>
        </>
      )}
    </div>
  );
}

export function EcoBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl p-3" style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)" }}>
      <span className="shrink-0 text-xs font-bold" style={{ color: "#7DE3F4" }}>
        ↺ ECO
      </span>
      <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY, lineHeight: 1.5 }}>
        {text}
      </p>
    </div>
  );
}
