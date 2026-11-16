import { CerebroDelCicloTab } from "./CerebroDelCicloTab";
import { ConexionesTab } from "./ConexionesTab";
import { EEGTab } from "./EEGTab";
import { SinergiasTab } from "./SinergiasTab";
import { VersionsTab } from "./VersionsTab";
import { ResonanceHeader } from "./ResonanceHeader";
import { ResonanceTabs } from "./ResonanceTabs";
import { NEURAL_FONT_BODY, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import type { ResonanceTab } from "./resonanceTabsConfig";
import type { useCycleResonance } from "./useCycleResonance";

type Resonance = ReturnType<typeof useCycleResonance>;

/**
 * "Resonancia del ciclo" — reemplaza por completo la vieja sección "Resumen
 * de hábitos" de Dashboard.tsx, y ahora ABRE la página (pedido explícito:
 * antes obligaba a bajar más allá de "Mi Palabra"/"Patrones detectados").
 * Identidad siempre oscura, independiente del tema claro/oscuro de la app
 * (mismo criterio ya establecido para Micro Acciones/Mi Palabra: una
 * sección puntual con su propio fondo fijo, `#070B1F` + los 2 resplandores
 * radiales del mockup) — por eso vive en su propio contenedor acá.
 *
 * `resonance`/`activeTab`/`onTabChange` vienen de Dashboard.tsx (no se
 * crean acá) — la franja compacta de compromisos/cadenas de caída que vive
 * ARRIBA de esta sección necesita cambiar de pestaña y hacer scroll hasta
 * acá, así que el estado tiene que vivir un nivel más arriba para que los
 * dos puedan compartirlo sin datos o cálculos duplicados.
 *
 * Las 5 pestañas ya están construidas: "Cerebro del ciclo",
 * "Electroencefalograma", "Mapa de conexiones", "Versiones de ti" y
 * "Sinergias".
 */
export function ResonanceSection({
  resonance,
  activeTab,
  onTabChange,
}: {
  resonance: Resonance;
  activeTab: ResonanceTab;
  onTabChange: (tab: ResonanceTab) => void;
}) {
  return (
    <div
      className="rounded-[24px] p-6 sm:p-8"
      style={{
        background:
          "radial-gradient(900px 600px at 22% 30%, rgba(124,92,255,0.18), transparent 70%), radial-gradient(700px 420px at 85% 10%, rgba(34,211,238,0.08), transparent 70%), #070B1F",
      }}
    >
      <div className="flex flex-col gap-6">
        <ResonanceHeader cycleNumber={resonance.cycleNumber} currentDay={resonance.currentDay} totalDays={resonance.totalDays} />
        <ResonanceTabs active={activeTab} onChange={onTabChange} />

        {resonance.isLoading && <p style={{ color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY, fontSize: 13 }}>Cargando resonancia del ciclo…</p>}
        {resonance.isError && <p className="text-red-400" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 13 }}>No se pudo cargar la resonancia de este ciclo.</p>}

        {!resonance.isLoading && !resonance.isError && (
          <>
            {activeTab === "mapa" && <ConexionesTab resonance={resonance} />}
            {activeTab === "cerebro" && <CerebroDelCicloTab resonance={resonance} />}
            {activeTab === "eeg" && <EEGTab resonance={resonance} />}
            {activeTab === "versiones" && <VersionsTab resonance={resonance} />}
            {activeTab === "sinergias" && <SinergiasTab resonance={resonance} />}
          </>
        )}
      </div>
    </div>
  );
}
