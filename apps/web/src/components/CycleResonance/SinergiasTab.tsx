import { useMemo, useState } from "react";
import { WoopFlow } from "../WoopFlow";
import type { OpenWoopFromInsight } from "../../lib/insightWoop";
import { NEURAL_CARD_BG, NEURAL_VIOLET_CARD_BORDER, NEURAL_FONT_BODY, NEURAL_FONT_DISPLAY, NEURAL_TEXT_SECONDARY } from "../NeuralCore/tokens";
import { CaidaChainCard } from "./CaidaChainCard";
import { SinergiaDominoStrip } from "./SinergiaDominoStrip";
import { SinergiaSidePanel } from "./SinergiaSidePanel";
import { SinergiasNetwork } from "./SinergiasNetwork";
import { layoutSynergyNetwork } from "./sinergiasLayout";
import { MIN_CYCLE_DAYS_FOR_SYNERGIES } from "./sinergiasLogic";
import { useSinergiasData } from "./useSinergiasData";
import type { useCycleResonance } from "./useCycleResonance";

type Resonance = ReturnType<typeof useCycleResonance>;

/**
 * "Sinergias" — puerto de Sinergias.dc.html con el historial diario REAL del
 * ciclo (`resonance.habitLogs`), nunca los `NODES`/`LINKS` de ejemplo del
 * archivo. Toda la aritmética vive en sinergiasLogic.ts/caidaChainLogic.ts
 * (probada en sus *.test.ts); el layout determinista en sinergiasLayout.ts;
 * acá solo se combinan los datos (useSinergiasData.ts, compartido con la
 * franja de Dashboard.tsx) y se dibuja.
 */
export function SinergiasTab({ resonance }: { resonance: Resonance }) {
  const data = useSinergiasData(resonance);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [woopPrefill, setWoopPrefill] = useState<Parameters<OpenWoopFromInsight>[0] | null>(null);
  const onOpenWoop: OpenWoopFromInsight = (args) => setWoopPrefill(args);

  const { result, chains, days } = data;
  const positions = useMemo(
    () => layoutSynergyNetwork(result.nodes.map((n) => ({ id: n.id, area: n.area, diff: n.diff })), result.links),
    [result.nodes, result.links],
  );
  const nodesById = data.synergyNodesById;
  const effectiveSelectedId = selectedId ?? result.anchorIds[0] ?? result.nodes[0]?.id ?? null;
  const selected = effectiveSelectedId ? (nodesById.get(effectiveSelectedId) ?? null) : null;
  const dominoChain = result.dominoChain.map((id) => nodesById.get(id)).filter((n): n is NonNullable<typeof n> => !!n);

  if (!data.ready) {
    return <p style={{ color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY, fontSize: 13 }}>Cargando sinergias…</p>;
  }

  if (!data.enoughData) {
    const progress = Math.min(100, Math.round((days.length / MIN_CYCLE_DAYS_FOR_SYNERGIES) * 100));
    return (
      <div
        className="mx-auto flex max-w-[1360px] flex-col items-center justify-center gap-3 rounded-[24px] p-10 text-center"
        style={{ background: NEURAL_CARD_BG, border: `1px solid ${NEURAL_VIOLET_CARD_BORDER}`, minHeight: 320 }}
      >
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>
          Necesitamos 14 días de datos para encontrar tus sinergias
        </span>
        <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, color: NEURAL_TEXT_SECONDARY, maxWidth: 420 }}>
          Las conexiones entre hábitos recién se ven con suficiente historial — llevas {days.length} {days.length === 1 ? "día" : "días"} de este
          ciclo.
        </p>
        <div style={{ width: 280, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
          <div style={{ width: `${progress}%`, height: 8, borderRadius: 4, background: "#C4B5FD", boxShadow: "0 0 8px #C4B5FD", transition: "width .4s ease" }} />
        </div>
        <span style={{ fontSize: 12, color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY }}>
          {days.length} / {MIN_CYCLE_DAYS_FOR_SYNERGIES} días
        </span>
      </div>
    );
  }

  if (!selected) {
    return (
      <div
        className="mx-auto flex max-w-[1360px] flex-col items-center justify-center gap-2 rounded-[24px] p-10 text-center"
        style={{ background: NEURAL_CARD_BG, border: `1px solid ${NEURAL_VIOLET_CARD_BORDER}`, minHeight: 320 }}
      >
        <span style={{ fontFamily: NEURAL_FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>Todavía no hay suficientes hábitos</span>
        <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, color: NEURAL_TEXT_SECONDARY, maxWidth: 420 }}>
          Para ver sinergias hace falta al menos un hábito con 3 días cumplidos y 3 no cumplidos (sin contar "no aplica") que no esté En poda.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6">
      <p className="m-0" style={{ fontFamily: NEURAL_FONT_BODY, fontSize: 14, lineHeight: 1.6, color: NEURAL_TEXT_SECONDARY, maxWidth: 720 }}>
        Tu red de hábitos: se conectan los que suelen cumplirse el mismo día. Toca uno para ver a quién arrastra.
      </p>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full min-w-0 lg:basis-[880px] lg:shrink lg:grow-0">
          <SinergiasNetwork nodes={result.nodes} links={result.links} positions={positions} selectedId={effectiveSelectedId} onSelect={setSelectedId} />
        </div>
        <div className="w-full min-w-0 lg:basis-[460px] lg:shrink lg:grow-0">
          <SinergiaSidePanel selected={selected} links={result.links} nodesById={nodesById} onSelect={setSelectedId} />
        </div>
      </div>

      <SinergiaDominoStrip chain={dominoChain} selectedId={effectiveSelectedId} onSelect={setSelectedId} />

      {!result.anchorIds.length && (
        <p style={{ color: NEURAL_TEXT_SECONDARY, fontFamily: NEURAL_FONT_BODY, fontSize: 13 }}>
          Todavía ningún hábito tiene suficiente efecto arrastre medido para sugerir un "efecto dominó" — sigue registrando y va a aparecer.
        </p>
      )}

      {chains.length > 0 && (
        <div id="cadena-de-caida" className="scroll-mt-6">
          <CaidaChainCard chain={chains[0]} totalChains={chains.length} onOpenWoop={onOpenWoop} />
        </div>
      )}

      {woopPrefill && (
        <WoopFlow
          onClose={() => setWoopPrefill(null)}
          initialTitle={woopPrefill.title}
          initialObstacle={woopPrefill.obstacle}
          sourceInsightType={woopPrefill.sourceInsightType}
          sourceInsightSummary={woopPrefill.sourceInsightSummary}
        />
      )}
    </div>
  );
}
