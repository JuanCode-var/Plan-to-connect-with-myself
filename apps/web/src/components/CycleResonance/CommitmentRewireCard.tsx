import { Link } from "react-router-dom";
import type { WordCommitment } from "../../api/word";
import { useSetCommitmentArea } from "../../api/word";
import { HABIT_CATEGORIES, HABIT_CATEGORY_LABELS, type HabitCategory } from "../../domain";
import { calculateWordProgress, milestonesWithinDuration } from "../../lib/wordProgress";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR, BRAIN_AREA_RGB } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";

function formatShort(dateOnlyISO: string): string {
  const [year, month, day] = dateOnlyISO.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

/**
 * "Mi Palabra" integrada en "Circuitos en recableado" (pedido explícito) —
 * mismo estilo que RewireCard.tsx (días sin alcohol/apuestas), pero el
 * avance es el % de plazo transcurrido de un compromiso (calculateWordProgress,
 * NO un contador de días cumplidos) y los hitos 7/21/30/66/90 solo se
 * muestran si cuadran dentro de la duración total (milestonesWithinDuration)
 * — un compromiso de 20 días nunca llega a mostrar el de 30 o más.
 */
export function CommitmentRewireCard({ commitment }: { commitment: WordCommitment }) {
  const setArea = useSetCommitmentArea();
  const progress = calculateWordProgress(commitment.startDate, commitment.targetDate);
  const area = commitment.area ? AREA_OF_CATEGORY[commitment.area] : null;
  const color = area ? BRAIN_AREA_COLOR[area] : NEURAL_LAVENDER;
  const rgb = area ? BRAIN_AREA_RGB[area] : "196,181,253";
  const milestones = milestonesWithinDuration(progress.daysTotal);

  const sub =
    progress.state === "upcoming"
      ? `Empieza el ${formatShort(commitment.startDate)}`
      : progress.state === "overdue"
        ? `Plazo cumplido el ${formatShort(commitment.targetDate)}`
        : `Día ${progress.daysElapsed} de ${progress.daysTotal} · faltan ${progress.daysRemaining} días`;

  return (
    <div
      style={{
        padding: "20px 22px",
        borderRadius: 20,
        background: `rgba(${rgb},0.05)`,
        border: `1px solid rgba(${rgb},0.4)`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER }}>
            CIRCUITO EN RECABLEADO
          </span>
          <span
            style={{
              fontFamily: NEURAL_FONT_BODY,
              fontSize: 15,
              fontWeight: 600,
              color: "#FFFFFF",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {commitment.title}
          </span>
        </div>
        <Link
          to="/palabra"
          style={{
            height: 44,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            borderRadius: 12,
            fontFamily: NEURAL_FONT_BODY,
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap",
            flexShrink: 0,
            color,
            border: `1px solid ${color}`,
            textDecoration: "none",
          }}
        >
          Ver documento
        </Link>
      </div>

      <div className="flex items-baseline gap-2.5">
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 42, fontWeight: 700, lineHeight: 1, color }}>{progress.percent}%</span>
      </div>
      <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, lineHeight: 1.45, color: NEURAL_TEXT_SECONDARY, minHeight: 19 }}>{sub}</span>

      <div className="relative" style={{ height: 34 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 4, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)" }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 4,
            height: 8,
            borderRadius: 4,
            width: `${progress.percent}%`,
            background: color,
            boxShadow: `0 0 10px ${color}`,
            transition: "width .6s ease",
          }}
        />
        {milestones.map((m) => {
          const reached = progress.daysElapsed >= m;
          const left = (m / progress.daysTotal) * 100;
          return (
            <div key={m}>
              <div
                style={{
                  position: "absolute",
                  left: `calc(${left}% - 7px)`,
                  top: 1,
                  width: 14,
                  height: 14,
                  boxSizing: "border-box",
                  borderRadius: "50%",
                  background: reached ? color : "#0E1330",
                  border: `2px solid ${reached ? color : "rgba(255,255,255,0.3)"}`,
                  boxShadow: reached ? `0 0 10px ${color}` : "none",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  top: 19,
                  transform: m === 90 ? "translateX(-100%)" : "translateX(-50%)",
                  fontFamily: NEURAL_FONT_BODY,
                  fontSize: 11,
                  color: reached ? "#FFFFFF" : NEURAL_TEXT_SECONDARY,
                  fontWeight: reached ? 600 : 400,
                }}
              >
                {m}
              </span>
            </div>
          );
        })}
      </div>

      <label className="flex items-center gap-2" style={{ marginTop: 6 }}>
        <span style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>Área</span>
        <select
          value={commitment.area ?? ""}
          disabled={setArea.isPending}
          onChange={(e) => setArea.mutate({ id: commitment.id, area: (e.target.value || null) as HabitCategory | null })}
          style={{
            height: 32,
            flexGrow: 1,
            minWidth: 0,
            borderRadius: 8,
            padding: "0 8px",
            fontFamily: NEURAL_FONT_BODY,
            fontSize: 12,
            color: "#E6E9F5",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          <option value="">Sin asignar</option>
          {HABIT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {HABIT_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
