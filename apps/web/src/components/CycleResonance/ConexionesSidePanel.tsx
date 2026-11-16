import { useUpdateHabit } from "../../api/habits";
import { BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREA_RGB, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { ConexionesHabitRows } from "./ConexionesHabitRows";
import type { ConexionesLayout, ConexionesNode } from "./conexionesLayout";
import { TIER_MESSAGE } from "./conexionesTokens";

/**
 * "Conexión seleccionada" (punto 8 del pedido) — nombre, chips, %, barra y
 * mensaje de la etapa (TIER_MESSAGE, copiado de Conexiones.dc.html), más la
 * lista de hábitos del área iluminada (o la del hábito seleccionado si no
 * hay ninguna área iluminada). En poda, "Reactivar"/"Pasar a reposo" llaman
 * a la misma mutación real que ya usa HabitRow.tsx (`active: true/false`),
 * nunca un botón decorativo sin acción detrás.
 */
export function ConexionesSidePanel({
  layout,
  selected,
  focusArea,
  selectedIndex,
  onSelectIndex,
}: {
  layout: ConexionesLayout;
  selected: ConexionesNode | null;
  focusArea: BrainArea | null;
  selectedIndex: number | null;
  onSelectIndex: (idx: number) => void;
}) {
  const updateHabit = useUpdateHabit();

  if (!selected) {
    return (
      <div
        className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-[24px] p-6 text-center"
        style={{
          background: "linear-gradient(170deg, rgba(34,211,238,0.07), rgba(255,255,255,0.03) 45%)",
          border: "1px solid rgba(34,211,238,0.25)",
        }}
      >
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: "#FFFFFF" }}>Todavía no hay conexiones</span>
        <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY, maxWidth: 320 }}>
          Este ciclo no tiene hábitos cargados aún — en cuanto agregues uno, aparece acá como su primera neurona.
        </p>
      </div>
    );
  }

  const area = selected.habit.area;
  const areaColor = BRAIN_AREA_COLOR[area];
  const tier = selected.habit.strength;
  const poda = tier.key === "poda";

  const listArea = focusArea ?? area;
  const listAreaColor = BRAIN_AREA_COLOR[listArea];
  const listAreaRgb = BRAIN_AREA_RGB[listArea];
  const listHub = layout.hubs[listArea];
  const rows = layout.nodes.map((node, idx) => ({ node, idx })).filter((o) => o.node.habit.area === listArea);

  return (
    <div
      className="flex h-full flex-col gap-3.5 rounded-[24px] p-6"
      style={{
        background: "linear-gradient(170deg, rgba(34,211,238,0.07), rgba(255,255,255,0.03) 45%)",
        border: "1px solid rgba(34,211,238,0.25)",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER, fontFamily: NEURAL_FONT_BODY }}>
        CONEXIÓN SELECCIONADA
      </span>
      <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 22, fontWeight: 700, lineHeight: 1.25, color: "#FFFFFF" }}>{selected.habit.name}</span>

      <div className="flex flex-wrap gap-2">
        <span style={{ fontSize: 12, fontWeight: 700, color: "#070B1F", padding: "4px 10px", borderRadius: 999, background: areaColor }}>
          {BRAIN_AREA_LABEL[area]}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: poda ? "#A9B1D6" : tier.color,
            padding: "4px 10px",
            borderRadius: 999,
            border: `1px solid ${poda ? "#64748B" : tier.color}`,
          }}
        >
          {tier.label}
        </span>
        {selected.habit.priority === "ALTA" && (
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: "#FB5C8C", padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(251,92,140,0.6)" }}>
            PRIORIDAD ALTA
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2.5">
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 44, fontWeight: 700, lineHeight: 1, color: areaColor }}>{selected.habit.percent}%</span>
        <span style={{ fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>cumplido este ciclo</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
        <div style={{ height: 8, borderRadius: 4, width: `${selected.habit.percent}%`, background: areaColor, boxShadow: `0 0 8px ${areaColor}` }} />
      </div>
      <span style={{ fontSize: 14, lineHeight: 1.55, color: "#E6E9F5" }}>{TIER_MESSAGE[tier.key]}</span>

      {poda && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={updateHabit.isPending}
            onClick={() => updateHabit.mutate({ id: selected.habit.id, data: { active: true } })}
            className="disabled:opacity-60"
            style={{
              height: 44,
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid rgba(34,211,238,0.5)",
              background: "rgba(34,211,238,0.08)",
              color: "#E6E9F5",
            }}
          >
            Reactivar
          </button>
          <button
            type="button"
            disabled={updateHabit.isPending}
            onClick={() => updateHabit.mutate({ id: selected.habit.id, data: { active: false } })}
            className="disabled:opacity-60"
            style={{
              height: 44,
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid rgba(169,177,214,0.4)",
              background: "transparent",
              color: NEURAL_TEXT_SECONDARY,
            }}
          >
            Pasar a reposo
          </button>
        </div>
      )}

      <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />

      <div className="flex items-baseline justify-between gap-2">
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", color: listAreaColor }}>ÁREA {BRAIN_AREA_LABEL[listArea].toUpperCase()}</span>
        <span style={{ fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>
          {listHub.n ? `promedio ${listHub.avg} % · ${listHub.n} conexiones` : "sin conexiones todavía"}
        </span>
      </div>
      <ConexionesHabitRows rows={rows} areaColor={listAreaColor} areaRgb={listAreaRgb} selectedIndex={selectedIndex} onSelect={onSelectIndex} />
    </div>
  );
}
