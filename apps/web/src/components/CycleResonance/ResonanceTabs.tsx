import { NEURAL_FONT_BODY, scale } from "../NeuralCore/tokens";
import { RESONANCE_TABS, RESONANCE_TAB_ACTIVE_BG, type ResonanceTab } from "./resonanceTabsConfig";

/**
 * Navegación interna de "Resonancia del ciclo" — reemplaza las 4 pestañas
 * actuales del Dashboard (ver SectionPager en Dashboard.tsx) por estas 5,
 * con "Cerebro del ciclo" como vista por defecto (pedido explícito). No
 * reutiliza SectionPager.tsx: ese componente ya trae su propia lógica de
 * flechas/overflow pensada para los `moment`s de Hábitos — acá el pedido es
 * un estilo de píldora específico (44px, activa en #22D3EE/#C4B5FD) que no
 * comparte ese componente hoy.
 */
export function ResonanceTabs({ active, onChange }: { active: ResonanceTab; onChange: (tab: ResonanceTab) => void }) {
  return (
    <div className="flex flex-wrap" style={{ gap: scale(10) }} role="tablist" aria-label="Secciones de Resonancia del ciclo">
      {RESONANCE_TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => onChange(tab.key)}
            style={{
              height: scale(44),
              padding: `0 ${scale(20)}px`,
              borderRadius: 999,
              fontFamily: NEURAL_FONT_BODY,
              fontSize: scale(14),
              fontWeight: 600,
              whiteSpace: "nowrap",
              background: isActive ? RESONANCE_TAB_ACTIVE_BG[tab.key] : "transparent",
              color: isActive ? "#070B1F" : "#FFFFFF",
              border: isActive ? "none" : "1px solid rgba(255,255,255,.14)",
              transition: "background .2s ease-out, color .2s ease-out, border-color .2s ease-out",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
