import { NEURAL_FONT_DISPLAY } from "../NeuralCore/tokens";
import type { ConexionesNode } from "./conexionesLayout";

/**
 * Fila "hábito + % + barra" reutilizada en dos lugares de ConexionesTab.tsx:
 * la lista de hábitos de un área en el panel derecho, y el listado por área
 * del respaldo para pantallas chicas ("en móvil usa la lista", punto 7 del
 * pedido) — mismo estilo de fila que Conexiones.dc.html (`.cx-row`), una sola
 * vez en vez de duplicar el markup en los dos lugares.
 */
export function ConexionesHabitRows({
  rows,
  areaColor,
  areaRgb,
  selectedIndex,
  onSelect,
}: {
  rows: Array<{ node: ConexionesNode; idx: number }>;
  areaColor: string;
  areaRgb: string;
  selectedIndex: number | null;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 overflow-hidden">
      {rows.map(({ node, idx }) => {
        const on = idx === selectedIndex;
        return (
          <button
            key={node.habit.id}
            type="button"
            className="cx-row"
            onClick={() => onSelect(idx)}
            style={{
              height: 34,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 8px",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "inherit",
              border: 0,
              width: "100%",
              boxSizing: "border-box",
              background: on ? `rgba(${areaRgb},0.14)` : "transparent",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: node.habit.strength.color }} />
            <span
              style={{
                flexGrow: 1,
                minWidth: 0,
                textAlign: "left",
                fontSize: 13,
                color: "#E6E9F5",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {node.habit.name}
            </span>
            <span style={{ width: 64, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", flexShrink: 0, position: "relative" }}>
              <span style={{ position: "absolute", left: 0, top: 0, height: 5, borderRadius: 3, width: `${node.habit.percent}%`, background: areaColor }} />
            </span>
            <span style={{ width: 40, textAlign: "right", fontFamily: NEURAL_FONT_DISPLAY, fontSize: 13, fontWeight: 700, color: "#FFFFFF", flexShrink: 0 }}>
              {node.habit.percent}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
