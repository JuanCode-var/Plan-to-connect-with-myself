import { Link } from "react-router-dom";
import type { WordCommitmentMonth, WordCommitmentUnlocked } from "../api/word";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL } from "./NeuralCore/brainTokens";
import { NEURAL_CYAN, NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import { firstName } from "../lib/greeting";
import { useAuth } from "../lib/useAuth";

function formatDayMonth(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("es-AR", { day: "numeric", month: "short" }).replace(/\.(?=\s|$)/, "");
}

function formatSignedDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }).replace(/\.(?=\s)/, "");
}

function segmentDays(month: WordCommitmentMonth): number {
  return Math.max(1, Math.round((new Date(month.endDate).getTime() - new Date(month.startDate).getTime()) / 86_400_000));
}

/** Barra dividida en tramos de mes, ancho proporcional a sus días — ver Paso 3 del pedido para los 4 colores de estado. */
function MonthBar({ months, areaColor, dayOfMonth, totalDaysInMonth }: { months: WordCommitmentMonth[]; areaColor: string; dayOfMonth: number; totalDaysInMonth: number }) {
  const totalDays = months.reduce((sum, m) => sum + segmentDays(m), 0);

  return (
    <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
      {months.map((m) => {
        const width = `${(segmentDays(m) / totalDays) * 100}%`;
        if (m.status === "sellado") {
          return <div key={m.monthIndex} style={{ width, background: NEURAL_GOLD, boxShadow: `0 0 6px ${NEURAL_GOLD}` }} />;
        }
        if (m.status === "pendiente_cierre") {
          return (
            <div key={m.monthIndex} style={{ width, backgroundImage: `repeating-linear-gradient(90deg, ${NEURAL_GOLD} 0 4px, transparent 4px 7px)` }} />
          );
        }
        if (m.status === "en_curso") {
          const pct = Math.min(100, (dayOfMonth / totalDaysInMonth) * 100);
          return (
            <div key={m.monthIndex} className="relative overflow-hidden" style={{ width, background: "rgba(255,255,255,0.1)" }}>
              <div className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: areaColor }} />
            </div>
          );
        }
        return <div key={m.monthIndex} style={{ width, background: "rgba(255,255,255,0.1)" }} />;
      })}
    </div>
  );
}

/**
 * Compromiso como "documento firmado" (mockups 12b/12d): borde superior del
 * color de su área, duración + chip de área, cuerpo en Lora, Mes X de Y con
 * barra de tramos (ver MonthBar), y estado final (pendiente/cumplido/
 * cerrado con honestidad) cuando ya terminó. "Reportar una caída" reemplaza
 * la vieja marca diaria — resuelve de una el mes en curso, sin sello.
 */
export function WordCommitmentCard({
  commitment,
  signatureDataUrl,
  signedAt,
  onOpenDocument,
  onReportFall,
  reportingFall,
}: {
  commitment: WordCommitmentUnlocked;
  signatureDataUrl: string | null;
  signedAt: string | null;
  onOpenDocument: () => void;
  onReportFall: () => void;
  reportingFall: boolean;
}) {
  const { user } = useAuth();

  const brainArea = commitment.area ? AREA_OF_CATEGORY[commitment.area] : null;
  const color = brainArea ? BRAIN_AREA_COLOR[brainArea] : "#64748B";
  const sealed = commitment.sealedCount > 0;
  const currentMonth = commitment.months.find((m) => m.monthIndex === commitment.currentMonthIndex);
  const canReportFall = commitment.finalState === null && currentMonth?.status === "en_curso" && !currentMonth?.fallReportedAt;

  return (
    <div
      className="flex flex-col gap-3 overflow-hidden rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderTop: `4px solid ${commitment.finalState === "sellado" ? NEURAL_GOLD : color}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: NEURAL_LAVENDER, textTransform: "uppercase" }}>
          {commitment.durationLabel}
        </span>
        {brainArea && (
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `${color}22`, color }}>
            {BRAIN_AREA_LABEL[brainArea]}
          </span>
        )}
      </div>

      <p className="m-0 line-clamp-4" style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 15, lineHeight: 1.5, color: NEURAL_TEXT }}>
        {commitment.text}
      </p>

      {commitment.finalState === "pendiente" ? (
        <div className="flex flex-col gap-1">
          <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 22, fontWeight: 700, color: NEURAL_TEXT }}>Terminado</span>
          <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Terminó el {formatDayMonth(commitment.targetDate)} · falta tu cierre de mes ↗
          </span>
        </div>
      ) : commitment.finalState === "sellado" ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 22, fontWeight: 700, color: NEURAL_TEXT }}>
              Cumplido <span style={{ fontSize: 14, fontWeight: 600, color: NEURAL_TEXT_SECONDARY }}>· {commitment.totalMonths} {commitment.totalMonths === 1 ? "mes" : "meses"}</span>
            </span>
            <span className="text-sm font-bold" style={{ color: NEURAL_GOLD }}>
              {commitment.sealedCount} {commitment.sealedCount === 1 ? "sello" : "sellos"}
            </span>
          </div>
          <MonthBar months={commitment.months} areaColor={color} dayOfMonth={commitment.dayOfMonth} totalDaysInMonth={commitment.totalDaysInMonth} />
          <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Palabra cumplida. Sello dorado ganado.
          </span>
        </div>
      ) : commitment.finalState === "sin_sello" ? (
        <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Cerrado con honestidad. Puedes volver a firmarlo.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 22, fontWeight: 700, color: NEURAL_TEXT }}>
              Mes {commitment.currentMonthIndex} <span style={{ fontSize: 14, fontWeight: 600, color: NEURAL_TEXT_SECONDARY }}>de {commitment.totalMonths}</span>
            </span>
            <span className="text-sm font-bold" style={{ color: sealed ? NEURAL_GOLD : NEURAL_TEXT_SECONDARY }}>
              {commitment.sealedCount} {commitment.sealedCount === 1 ? "sello" : "sellos"}
            </span>
          </div>
          <MonthBar months={commitment.months} areaColor={color} dayOfMonth={commitment.dayOfMonth} totalDaysInMonth={commitment.totalDaysInMonth} />
          {currentMonth?.fallReportedAt ? (
            <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Caída reportada · este mes no se sellará
            </span>
          ) : currentMonth?.status === "pendiente_cierre" ? (
            <span className="text-xs" style={{ color: NEURAL_GOLD }}>
              Terminó el {formatDayMonth(currentMonth.endDate)} · falta tu cierre de mes
            </span>
          ) : (
            currentMonth && (
              <span className="text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Día {commitment.dayOfMonth} de {commitment.totalDaysInMonth} del mes · cierre el {formatDayMonth(currentMonth.endDate)}
              </span>
            )
          )}
          {currentMonth?.fallReportedAt && (
            <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: NEURAL_TEXT_SECONDARY }}>
              Gracias por tu honestidad. Este mes no se sellará, pero tus meses sellados siguen intactos.{" "}
              <Link to="/journal" className="font-semibold" style={{ color: NEURAL_GOLD }}>
                Escribe qué pasó →
              </Link>
            </div>
          )}
        </div>
      )}

      {canReportFall && (
        <button
          type="button"
          disabled={reportingFall}
          onClick={onReportFall}
          className="self-start text-left disabled:opacity-60"
          style={{ fontSize: 12, color: "#A9B1D6" }}
        >
          Reportar una caída
        </button>
      )}

      <div className="mt-1 flex items-center justify-between border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex flex-col">
          <span style={{ fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", fontSize: 14, color: NEURAL_LAVENDER }}>
            {signatureDataUrl ? (user ? firstName(user.name) : "—") : "Sin firmar"}
          </span>
          {signedAt && <span style={{ fontSize: 11, color: NEURAL_TEXT_SECONDARY }}>Firmado el {formatSignedDate(signedAt)}</span>}
        </div>
        <button type="button" onClick={onOpenDocument} className="text-xs font-semibold" style={{ color: NEURAL_CYAN }}>
          Ver documento
        </button>
      </div>
    </div>
  );
}
