// Firma compartida del callback "abrir WOOP prellenado" que pasan
// InsightsPanel.tsx/pages/Patrones.tsx hacia abajo, a través de
// insightDisplay.tsx, hasta los 3 botones de acción de las tarjetas de
// patrones (InsightChainCard/InsightWeekdayCard/InsightEmotionCard).
export type OpenWoopFromInsight = (args: {
  title?: string;
  obstacle: string;
  sourceInsightType: string;
  sourceInsightSummary: string;
}) => void;
