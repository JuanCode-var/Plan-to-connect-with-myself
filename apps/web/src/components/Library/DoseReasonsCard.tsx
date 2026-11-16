import { BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_LAVENDER } from "../NeuralCore/tokens";
import type { YesterdayPendingHabit } from "./doseSelector";

function Bullet({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, lineHeight: 1.5, color: "#E6E9F5" }}>
      <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span>{children}</span>
    </li>
  );
}

/** "POR QUÉ ESTA DOSIS, HOY" (Fase 2, columna izquierda) — 3 razones reales, nunca genéricas sin dato detrás. */
export function DoseReasonsCard({
  area,
  areaPercent,
  yesterdayHabit,
  sourceTitle,
}: {
  area: BrainArea;
  areaPercent: number | null;
  yesterdayHabit: YesterdayPendingHabit | null;
  sourceTitle: string | null;
}) {
  const color = BRAIN_AREA_COLOR[area];

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
        POR QUÉ ESTA DOSIS, HOY
      </span>
      <ul className="m-0 flex flex-col gap-2 p-0" style={{ listStyle: "none" }}>
        <Bullet color={color}>
          {areaPercent !== null ? `${BRAIN_AREA_LABEL[area]} va en ${areaPercent} % este ciclo — la que más espacio tiene para crecer.` : `${BRAIN_AREA_LABEL[area]} todavía no tiene hábitos este ciclo.`}
        </Bullet>
        <Bullet color={color}>
          {yesterdayHabit ? (
            <>
              Ayer «{yesterdayHabit.name}» quedó pendiente, y es prioridad alta.
            </>
          ) : (
            "No hay un pendiente puntual de ayer — igual es el área con más lugar para crecer."
          )}
        </Bullet>
        {sourceTitle && <Bullet color={color}>Basada en {sourceTitle}.</Bullet>}
      </ul>
    </div>
  );
}
