import type { Insight } from "../api/insights";
import { InsightChainCard } from "./InsightChainCard";
import { InsightCompactRow } from "./InsightCompactRow";
import { InsightEmotionCard } from "./InsightEmotionCard";
import { InsightWeekdayCard } from "./InsightWeekdayCard";
import type { OpenWoopFromInsight } from "../lib/insightWoop";

/**
 * Despachadores compartidos entre la vista resumida de Resumen
 * (InsightsPanel) y la vista entera (pages/Patrones.tsx) — un mismo insight
 * se renderiza igual en los dos lugares, así que vive en un solo sitio.
 * `onOpenWoop` solo hace falta en la versión destacada: es la única que
 * muestra los 3 botones de acción (ver InsightChainCard/Weekday/Emotion).
 */
export function FeaturedCard({ insight, onOpenWoop }: { insight: Insight; onOpenWoop?: OpenWoopFromInsight }) {
  if (insight.type === "chain") return <InsightChainCard insight={insight} featured onOpenWoop={onOpenWoop} />;
  if (insight.type === "weekday") return <InsightWeekdayCard insight={insight} onOpenWoop={onOpenWoop} />;
  return <InsightEmotionCard insight={insight} onOpenWoop={onOpenWoop} />;
}

export function CompactItem({ insight }: { insight: Insight }) {
  if (insight.type === "chain") return <InsightChainCard insight={insight} featured={false} />;
  return <InsightCompactRow insight={insight} />;
}
