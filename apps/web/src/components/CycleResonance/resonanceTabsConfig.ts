export type ResonanceTab = "mapa" | "cerebro" | "eeg" | "versiones" | "sinergias";

export const RESONANCE_TABS: Array<{ key: ResonanceTab; label: string }> = [
  { key: "mapa", label: "Mapa de conexiones" },
  { key: "cerebro", label: "Cerebro del ciclo" },
  { key: "eeg", label: "Electroencefalograma" },
  { key: "versiones", label: "Versiones de ti" },
  { key: "sinergias", label: "Sinergias" },
];

// Regla de color "Núcleo Neural" (no negociable): CIAN #22D3EE = única
// pestaña activa en toda la app. La excepción anterior de "Sinergias" en
// lavanda quedó revertida a pedido explícito posterior — todas las pestañas
// activas, sin excepción, usan el mismo cian.
export const RESONANCE_TAB_ACTIVE_BG: Record<ResonanceTab, string> = {
  mapa: "#22D3EE",
  cerebro: "#22D3EE",
  eeg: "#22D3EE",
  versiones: "#22D3EE",
  sinergias: "#22D3EE",
};
