import { Link } from "react-router-dom";
import { NEURAL_FONT_BODY, NEURAL_LAVENDER, NEURAL_TEXT_SOFT, scale } from "./tokens";

export const NEURAL_MAP_ROUTE = "/mi-mapa-neuronal";

export function LastEventCard({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: `${scale(18)}px ${scale(20)}px`,
        borderRadius: scale(16),
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <span
        style={{
          fontFamily: NEURAL_FONT_BODY,
          fontSize: scale(12),
          fontWeight: 600,
          letterSpacing: "1.5px",
          color: NEURAL_LAVENDER,
        }}
      >
        ÚLTIMO EVENTO
      </span>
      <p className="m-0" style={{ marginTop: scale(6), fontFamily: NEURAL_FONT_BODY, fontSize: scale(15), lineHeight: 1.5, color: NEURAL_TEXT_SOFT }}>
        {message}
      </p>
      <Link
        to={NEURAL_MAP_ROUTE}
        className="inline-block"
        style={{ marginTop: scale(8), fontFamily: NEURAL_FONT_BODY, fontSize: scale(14), fontWeight: 600, color: "#22D3EE" }}
      >
        Ver mi mapa neuronal →
      </Link>
    </div>
  );
}
