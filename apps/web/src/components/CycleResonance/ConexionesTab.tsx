import { useMemo, useState } from "react";
import { BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, BRAIN_AREA_RGB, type BrainArea } from "../NeuralCore/brainTokens";
import { NEURAL_FONT_BODY, NEURAL_LAVENDER, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { ConexionesHabitRows } from "./ConexionesHabitRows";
import { ConexionesMap } from "./ConexionesMap";
import { ConexionesSidePanel } from "./ConexionesSidePanel";
import { buildConexionesLayout } from "./conexionesLayout";
import { RING_ORDER } from "./conexionesTokens";
import type { useCycleResonance } from "./useCycleResonance";

type Resonance = ReturnType<typeof useCycleResonance>;

const ALL_RGB = "230,233,245";
const ALL_COLOR = "#E6E9F5";

/**
 * "Mapa de conexiones" (reemplaza "Por hábito") — puerto de layout(),
 * quad(), ctrlFor() y draw() de Conexiones.dc.html (ver conexionesLayout.ts
 * y ConexionesMap.tsx) con los hábitos reales del ciclo
 * (`resonance.byHabit`), nunca los 29 hábitos de ejemplo del mockup.
 *
 * El canvas+botones (ConexionesMap.tsx) requiere espacio para que las zonas
 * táctiles de 30px no queden inservibles — por debajo de `lg` se oculta y
 * se muestra en su lugar la lista agrupada por área (punto 7 del pedido:
 * "en móvil usa la lista"), que comparte la misma selección y el mismo
 * filtro "Iluminar área" que el mapa.
 */
export function ConexionesTab({ resonance }: { resonance: Resonance }) {
  const layout = useMemo(() => buildConexionesLayout(resonance.byHabit), [resonance.byHabit]);
  const [focusArea, setFocusArea] = useState<BrainArea | null>(null);
  const [rawSelectedIndex, setRawSelectedIndex] = useState<number | null>(null);

  const selectedIndex = rawSelectedIndex !== null && rawSelectedIndex < layout.nodes.length ? rawSelectedIndex : layout.nodes.length ? 0 : null;
  const selected = selectedIndex !== null ? layout.nodes[selectedIndex] : null;

  const filters: Array<{ area: BrainArea | null; label: string; color: string; rgb: string; empty: boolean }> = [
    { area: null, label: "Todas", color: ALL_COLOR, rgb: ALL_RGB, empty: false },
    ...RING_ORDER.map((area) => ({
      area,
      label: BRAIN_AREA_LABEL[area],
      color: BRAIN_AREA_COLOR[area],
      rgb: BRAIN_AREA_RGB[area],
      empty: layout.hubs[area].n === 0,
    })),
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6">
      <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, lineHeight: 1.6, color: NEURAL_TEXT_SECONDARY, maxWidth: 720 }}>
        Tú estás en el centro. Cada área es una dendrita y cada hábito, una neurona: cuanto más fuerte la conexión, más cerca del núcleo y más
        impulsos la recorren.
      </p>

      <div role="group" aria-label="Iluminar área" className="flex flex-wrap items-center gap-2">
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "1.5px", color: NEURAL_LAVENDER, fontFamily: NEURAL_FONT_BODY, marginRight: 6 }}>
          ILUMINAR ÁREA
        </span>
        {filters.map((f) => {
          const on = focusArea === f.area;
          return (
            <button
              key={f.label}
              type="button"
              aria-pressed={on}
              onClick={() => setFocusArea(on ? null : f.area)}
              style={{
                height: 44,
                padding: "0 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: NEURAL_FONT_BODY,
                fontSize: 13,
                fontWeight: 600,
                color: on ? "#070B1F" : f.empty ? NEURAL_TEXT_SECONDARY : "#E6E9F5",
                background: on ? f.color : `rgba(${f.rgb},0.06)`,
                border: `1px solid rgba(${f.rgb},${on ? 1 : 0.4})`,
              }}
            >
              {f.area && <span style={{ width: 8, height: 8, borderRadius: "50%", background: on ? "#070B1F" : f.color }} />}
              {f.empty ? `${f.label} · 0` : f.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="hidden w-full min-w-0 lg:block lg:basis-[900px] lg:shrink lg:grow-0">
          <ConexionesMap
            layout={layout}
            focusArea={focusArea}
            onFocusArea={setFocusArea}
            selectedIndex={selectedIndex}
            onSelectIndex={setRawSelectedIndex}
            percentGeneral={resonance.percentGeneral}
          />
        </div>

        <div className="flex w-full min-w-0 flex-col gap-4 lg:hidden">
          {RING_ORDER.filter((area) => !focusArea || focusArea === area).map((area) => {
            const hub = layout.hubs[area];
            const rows = layout.nodes.map((node, idx) => ({ node, idx })).filter((o) => o.node.habit.area === area);
            return (
              <div
                key={area}
                className="rounded-[18px] p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
              >
                <div className="flex items-baseline justify-between gap-2 pb-2">
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", color: BRAIN_AREA_COLOR[area] }}>
                    {BRAIN_AREA_LABEL[area].toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: NEURAL_TEXT_SECONDARY }}>
                    {hub.n ? `promedio ${hub.avg} % · ${hub.n} conexiones` : "sin conexiones todavía"}
                  </span>
                </div>
                {rows.length > 0 ? (
                  <ConexionesHabitRows
                    rows={rows}
                    areaColor={BRAIN_AREA_COLOR[area]}
                    areaRgb={BRAIN_AREA_RGB[area]}
                    selectedIndex={selectedIndex}
                    onSelect={setRawSelectedIndex}
                  />
                ) : (
                  <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13, color: NEURAL_TEXT_SECONDARY }}>
                    Todavía no hay hábitos en esta área.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="w-full min-w-0 lg:basis-[440px] lg:shrink lg:grow-0">
          <ConexionesSidePanel layout={layout} selected={selected} focusArea={focusArea} selectedIndex={selectedIndex} onSelectIndex={setRawSelectedIndex} />
        </div>
      </div>

      {!layout.nodes.length && (
        <p style={{ color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY, fontSize: 13 }}>
          Todavía no hay hábitos cargados este ciclo — el mapa se va a poblar en cuanto agregues el primero.
        </p>
      )}
    </div>
  );
}
