import { Link } from "react-router-dom";
import { NEURAL_FONT_BODY, NEURAL_LAVENDER } from "../NeuralCore/tokens";

function SparkIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth={2} strokeLinejoin="round">
      <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" />
    </svg>
  );
}

/**
 * "Experimento de la semana" — el CTA real va a Seguimiento (mismo criterio
 * que RewireCard.tsx en Cerebro del ciclo): no hay ningún "aceptar el reto"
 * que persista nada hoy, así que el enlace lleva a donde SÍ se puede actuar
 * de verdad en vez de un botón sin comportamiento detrás.
 */
export function WeeklyExperimentCard({ text }: { text: string }) {
  return (
    <div
      className="flex h-full flex-col gap-2.5"
      style={{
        padding: 20,
        borderRadius: 20,
        background: "linear-gradient(160deg, rgba(124,92,255,0.18), rgba(34,211,238,0.06))",
        border: "1px solid rgba(167,139,250,0.35)",
      }}
    >
      <div className="flex items-center gap-2">
        <SparkIcon />
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
          EXPERIMENTO DE LA SEMANA
        </span>
      </div>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, lineHeight: 1.55, color: "#E6E9F5" }}>{text}</span>
      <Link
        to="/tracker#tracker-checklist"
        className="mt-auto"
        style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
      >
        Ir a Seguimiento →
      </Link>
    </div>
  );
}
