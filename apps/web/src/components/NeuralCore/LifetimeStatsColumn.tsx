import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_TEXT_SECONDARY, scale } from "./tokens";

export function LifetimeStatsColumn({
  totalImpulsosDeVida,
  nucleoPlenoDays,
  activeDays,
}: {
  totalImpulsosDeVida: number;
  nucleoPlenoDays: number;
  activeDays: number;
}) {
  return (
    <div className="flex flex-col" style={{ gap: scale(12) }}>
      <div
        style={{
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.10)",
          borderRadius: scale(16),
          padding: `${scale(16)}px ${scale(18)}px`,
        }}
      >
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), color: NEURAL_TEXT_SECONDARY }}>
          Impulsos de por vida
        </span>
        <p className="m-0" style={{ marginTop: scale(4), fontFamily: NEURAL_FONT_DISPLAY, fontSize: scale(30), fontWeight: 700, color: "#ffffff" }}>
          {totalImpulsosDeVida.toLocaleString("es-CO")}
        </p>
      </div>

      <div className="grid grid-cols-2" style={{ gap: scale(12) }}>
        <div
          style={{
            background: "rgba(253,230,138,.06)",
            border: "1px solid rgba(253,230,138,.35)",
            borderRadius: scale(16),
            padding: `${scale(14)}px ${scale(16)}px`,
          }}
        >
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), color: NEURAL_TEXT_SECONDARY }}>
            Núcleo pleno
          </span>
          <p className="m-0" style={{ marginTop: scale(4), fontFamily: NEURAL_FONT_DISPLAY, fontSize: scale(24), fontWeight: 700, color: "#FDE68A" }}>
            {nucleoPlenoDays} días
          </p>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.10)",
            borderRadius: scale(16),
            padding: `${scale(14)}px ${scale(16)}px`,
          }}
        >
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), color: NEURAL_TEXT_SECONDARY }}>
            Días activos
          </span>
          <p className="m-0" style={{ marginTop: scale(4), fontFamily: NEURAL_FONT_DISPLAY, fontSize: scale(24), fontWeight: 700, color: "#ffffff" }}>
            {activeDays}/30
          </p>
        </div>
      </div>
    </div>
  );
}
