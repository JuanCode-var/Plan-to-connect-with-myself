import { BRAIN_AREA_COLOR, BRAIN_AREA_DARK_COLOR, BRAIN_AREA_LABEL, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY } from "../NeuralCore/tokens";

/** Mini portada 104×148 — degradado 165° del color del área a su variante oscura, etiqueta de área arriba, título abajo con sombra lateral para que se lea sobre cualquier parte del degradado. */
export function BookCoverMini({ area, title }: { area: BrainArea; title: string | null }) {
  const color = BRAIN_AREA_COLOR[area];
  const dark = BRAIN_AREA_DARK_COLOR[area];
  return (
    <div
      className="flex flex-shrink-0 flex-col justify-between overflow-hidden rounded-xl"
      style={{
        width: 104,
        height: 148,
        padding: 10,
        background: `linear-gradient(165deg, ${color}, ${dark})`,
        boxShadow: "4px 6px 16px rgba(0,0,0,0.35)",
      }}
    >
      <span
        style={{
          fontFamily: NEURAL_FONT_BODY,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "1px",
          color: "rgba(7,11,31,0.75)",
          textTransform: "uppercase",
        }}
      >
        {BRAIN_AREA_LABEL[area]}
      </span>
      <span
        style={{
          fontFamily: NEURAL_FONT_DISPLAY,
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1.25,
          color: "#FFFFFF",
          textShadow: "0 1px 4px rgba(0,0,0,0.4)",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {title ?? "Sin título"}
      </span>
    </div>
  );
}
