import { useNavigate } from "react-router-dom";
import { BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREA_RGB, type BrainArea } from "./brainTokens";
import { NEURAL_FONT_BODY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY, NEURAL_TEXT_SOFT, scale } from "./tokens";

type AttenuatingArea = { area: BrainArea; diasSinImpulsos: number; brightness: number };

/** "Reactivar" lleva a /habits?area={key}, que filtra el catálogo por esa área real (ver Habits.tsx). */
export function PruningCard({
  attenuating,
  justReactivatedArea,
}: {
  attenuating: AttenuatingArea[];
  justReactivatedArea: { area: BrainArea } | undefined;
}) {
  const navigate = useNavigate();

  const finalMessage = justReactivatedArea
    ? `Circuito ${BRAIN_AREA_LABEL[justReactivatedArea.area]} reactivado. Tu sendero seguía ahí, esperándote.`
    : "Tu circuito sigue ahí. Un impulso hoy lo reactiva.";

  return (
    <div style={{ borderRadius: scale(18), padding: scale(18), background: "rgba(255,255,255,.03)" }}>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
        PODA SUAVE
      </span>
      <p className="m-0" style={{ marginTop: scale(6), fontFamily: NEURAL_FONT_BODY, fontSize: scale(13), color: NEURAL_TEXT_SECONDARY }}>
        Los circuitos que no usas se atenúan poco a poco, pero nunca se borran.
      </p>

      {attenuating.length === 0 ? (
        <p className="m-0" style={{ marginTop: scale(14), fontFamily: NEURAL_FONT_BODY, fontSize: scale(13), fontWeight: 600, color: "#34D399" }}>
          Todos tus circuitos están activos.
        </p>
      ) : (
        <div className="flex flex-col" style={{ marginTop: scale(14), gap: scale(10) }}>
          {attenuating.map(({ area, diasSinImpulsos, brightness }) => {
            const color = BRAIN_AREA_COLOR[area];
            const rgb = BRAIN_AREA_RGB[area];
            return (
              <div
                key={area}
                className="flex items-center justify-between gap-3"
                style={{
                  borderRadius: scale(12),
                  padding: `${scale(10)}px ${scale(12)}px`,
                  background: `rgba(${rgb},.06)`,
                  border: `1px solid rgba(${rgb},.35)`,
                }}
              >
                <div className="min-w-0">
                  <p className="m-0 truncate" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(14), fontWeight: 600, color: "#ffffff" }}>
                    {BRAIN_AREA_LABEL[area]}
                  </p>
                  <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: scale(12), color: NEURAL_TEXT_SECONDARY }}>
                    {diasSinImpulsos} día{diasSinImpulsos === 1 ? "" : "s"} sin impulsos · brillo {Math.round(brightness * 100)}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/habits?area=${area}`)}
                  aria-label={`Reactivar circuito ${BRAIN_AREA_LABEL[area]}`}
                  className="shrink-0 font-semibold"
                  style={{
                    height: Math.max(44, scale(44)),
                    borderRadius: scale(10),
                    padding: `0 ${scale(14)}px`,
                    border: `1px solid ${color}`,
                    color,
                    background: "transparent",
                    fontFamily: NEURAL_FONT_BODY,
                    fontSize: scale(13),
                  }}
                >
                  Reactivar
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="m-0" style={{ marginTop: scale(14), fontFamily: NEURAL_FONT_BODY, fontSize: scale(13), color: NEURAL_TEXT_SOFT }}>
        {finalMessage}
      </p>
    </div>
  );
}
