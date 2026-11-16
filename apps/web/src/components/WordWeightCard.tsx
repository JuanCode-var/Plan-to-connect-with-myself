import type { ReactNode } from "react";
import type { WordCommitmentMonth, WordCommitmentUnlocked } from "../api/word";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR } from "./NeuralCore/brainTokens";
import { NEURAL_GOLD, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY, NEURAL_VIOLET_CARD_BORDER } from "./NeuralCore/tokens";

function monthAbbr(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("es-AR", { month: "short" }).replace(/\.$/, "");
}

function formatDayMonth(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("es-AR", { day: "numeric", month: "short" }).replace(/\.(?=\s|$)/, "");
}

function rangeLabel(month: WordCommitmentMonth): string {
  const start = monthAbbr(month.startDate);
  const end = monthAbbr(month.endDate);
  return start === end ? start.charAt(0).toUpperCase() + start.slice(1) : `${start.charAt(0).toUpperCase() + start.slice(1)} – ${end.charAt(0).toUpperCase() + end.slice(1)}`;
}

type Medal = { key: string; title: string; month: WordCommitmentMonth; color: string; dayOfMonth: number; totalDaysInMonth: number };

function Medal({ medal }: { medal: Medal }) {
  const { month, color } = medal;
  let inner: ReactNode;
  let ring: string;
  let subLabel: string;
  let subColor = NEURAL_TEXT_SECONDARY;

  if (month.status === "sellado") {
    ring = color;
    inner = (
      <span className="flex h-full w-full items-center justify-center rounded-full text-lg font-bold" style={{ background: NEURAL_GOLD, color: "#070B1F" }}>
        ✓
      </span>
    );
    subLabel = rangeLabel(month);
  } else if (month.status === "pendiente_cierre") {
    ring = "transparent";
    inner = (
      <span className="flex h-full w-full items-center justify-center rounded-full border-2 border-dashed text-lg font-bold" style={{ borderColor: NEURAL_GOLD, color: NEURAL_GOLD }}>
        ?
      </span>
    );
    subLabel = "Por cerrar";
    subColor = NEURAL_GOLD;
  } else if (month.status === "en_curso") {
    const pct = Math.min(1, medal.dayOfMonth / medal.totalDaysInMonth);
    ring = color;
    inner = (
      <span
        className="flex h-full w-full items-center justify-center rounded-full text-xs font-bold"
        style={{ background: `conic-gradient(${color} ${pct * 360}deg, rgba(255,255,255,0.08) ${pct * 360}deg)`, color: NEURAL_TEXT }}
      >
        <span className="flex h-[78%] w-[78%] items-center justify-center rounded-full" style={{ background: "#0B0F28" }}>
          {medal.dayOfMonth}/{medal.totalDaysInMonth}
        </span>
      </span>
    );
    subLabel = `Cierra ${formatDayMonth(month.endDate)}`;
  } else {
    ring = "rgba(255,255,255,0.18)";
    inner = (
      <span className="flex h-full w-full items-center justify-center rounded-full border text-lg font-bold" style={{ borderColor: "rgba(255,255,255,0.18)", color: NEURAL_TEXT_SECONDARY }}>
        –
      </span>
    );
    subLabel = rangeLabel(month);
  }

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: 76 }}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full p-0.5" style={{ border: `2px solid ${ring}` }}>
        {inner}
      </span>
      <span className="truncate text-center text-xs font-semibold" title={medal.title} style={{ color: NEURAL_TEXT, maxWidth: 76 }}>
        {medal.title}
      </span>
      <span className="text-center text-[11px]" style={{ color: subColor, maxWidth: 76 }}>
        {subLabel}
      </span>
    </div>
  );
}

/** "Peso de tu palabra" (mockups 12b/12c) — medallas por mes sellado/pendiente/en curso/sin sello, no una racha de días. Ambiente violeta propio (pedido explícito de este mockup). */
export function WordWeightCard({ commitments, monthsWeight, weaknessText }: { commitments: WordCommitmentUnlocked[]; monthsWeight: number; weaknessText: string | null }) {
  const medals: Medal[] = [];
  for (const c of commitments) {
    const area = c.area ? AREA_OF_CATEGORY[c.area] : null;
    const color = area ? BRAIN_AREA_COLOR[area] : "#64748B";
    for (const m of c.months) {
      if (m.status === "futuro") continue;
      medals.push({
        key: `${c.id}-${m.monthIndex}`,
        title: c.title,
        month: m,
        color,
        dayOfMonth: m.monthIndex === c.currentMonthIndex ? c.dayOfMonth : 0,
        totalDaysInMonth: m.monthIndex === c.currentMonthIndex ? c.totalDaysInMonth : 1,
      });
    }
  }
  medals.sort((a, b) => a.month.startDate.localeCompare(b.month.startDate));

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${NEURAL_VIOLET_CARD_BORDER}` }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: NEURAL_LAVENDER, textTransform: "uppercase" }}>
          Peso de tu palabra
        </span>
        <span className="text-right text-xs" style={{ color: NEURAL_TEXT_SECONDARY, maxWidth: 220 }}>
          Se mide en meses cumplidos, no en días marcados.
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 56, fontWeight: 700, color: NEURAL_TEXT }}>{monthsWeight}</span>
        <span style={{ fontSize: 14, color: NEURAL_TEXT_SECONDARY }}>{monthsWeight === 1 ? "mes honrando tu palabra" : "meses honrando tu palabra"}</span>
      </div>

      {medals.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {medals.map((m) => (
            <Medal key={m.key} medal={m} />
          ))}
        </div>
      )}

      {weaknessText && (
        <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY, lineHeight: 1.5 }}>
          Tu debilidad declarada era &ldquo;{weaknessText}&rdquo;. Cada sello dorado es un mes entero de prueba de que estás cambiando.
        </p>
      )}
    </div>
  );
}
