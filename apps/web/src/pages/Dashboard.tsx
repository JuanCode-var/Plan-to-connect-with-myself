import { useState } from "react";
import { useCycles } from "../api/tracking";
import { useCycleSummary } from "../api/dashboard";
import { useWordCommitments } from "../api/word";
import { CycleSelector } from "../components/CycleSelector";
import { SectionIntro } from "../components/SectionIntro";
import { NextCycleFocusBanner } from "../components/CycleResonance/NextCycleFocusBanner";
import { ResonanceQuickStrip } from "../components/CycleResonance/ResonanceQuickStrip";
import { ResonanceSection } from "../components/CycleResonance/ResonanceSection";
import type { ResonanceTab } from "../components/CycleResonance/resonanceTabsConfig";
import { useCycleResonance } from "../components/CycleResonance/useCycleResonance";
import { useSinergiasData } from "../components/CycleResonance/useSinergiasData";
import { isCommitmentActive } from "../lib/wordProgress";

function formatDayMonth(dateISO: string): string {
  const [, month, day] = dateISO.slice(0, 10).split("-");
  return `${day}/${month}`;
}

export function Dashboard() {
  const { data: cycles, isLoading: cyclesLoading, isError: cyclesError } = useCycles();
  // Mismo patrón que /tracker: `undefined` = "sin preferencia explícita
  // todavía", el ciclo activo por defecto se deriva en cada render a partir
  // de `isActive` (única fuente de verdad, calculada en el backend).
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>(undefined);

  const selectedCycleStillExists =
    !!selectedCycleId && !!cycles?.some((c) => c.id === selectedCycleId);
  const defaultCycleId =
    cycles && cycles.length > 0
      ? (cycles.find((c) => c.isActive) ?? cycles[cycles.length - 1]).id
      : undefined;
  const effectiveCycleId = selectedCycleStillExists ? selectedCycleId : defaultCycleId;
  const isActiveCycle = cycles?.find((c) => c.id === effectiveCycleId)?.isActive ?? false;

  const { data: summary } = useCycleSummary(effectiveCycleId);
  const { data: commitments } = useWordCommitments();

  // "Resonancia del ciclo" (y su franja de compromisos/cadenas de caída de
  // arriba) ahora comparten el MISMO `resonance`/`activeTab` — antes
  // ResonanceSection los tenía adentro, sin forma de que la franja del
  // Resumen cambiara de pestaña ni hiciera scroll hacia ella.
  const resonance = useCycleResonance(effectiveCycleId);
  const [activeTab, setActiveTab] = useState<ResonanceTab>("cerebro");
  const sinergiasData = useSinergiasData(resonance);

  const activeCommitmentsCount = (commitments ?? []).filter(isCommitmentActive).length;
  const caidaChainsCount = sinergiasData.enoughData ? sinergiasData.chains.length : 0;

  // Doble requestAnimationFrame (no un efecto): el primero espera a que React
  // COMMITEE el cambio de pestaña (el id que se busca recién existe en el DOM
  // después de eso), el segundo a que el layout ya esté asentado — funciona
  // incluso si ya se estaba en esa pestaña (un efecto atado a `activeTab` no
  // se dispararía de nuevo en ese caso, porque el valor no cambiaría).
  function scrollToAfterTabChange(id: string) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function openRecableado() {
    setActiveTab("cerebro");
    scrollToAfterTabChange("recableado");
  }
  function openCadenaDeCaida() {
    setActiveTab("sinergias");
    scrollToAfterTabChange("cadena-de-caida");
  }

  return (
    <div className="min-h-full px-4 py-6 sm:px-8 sm:py-8" style={{ color: "var(--text)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-2)" }}>
                {summary
                  ? `${summary.cycle.name} · ${formatDayMonth(summary.cycle.startDate)} – ${formatDayMonth(summary.cycle.endDate)}`
                  : "Panel de resumen"}
              </div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">Resumen</h1>
            </div>
            <SectionIntro
              id="dashboard"
              startCollapsed
              purpose="El panorama general del ciclo activo."
              steps={[
                "Elige arriba el ciclo si quieres ver uno pasado.",
                "Mira el % general y por hábito en Resonancia del ciclo.",
                "Revisa \"Cadena de caída\" en Sinergias, lo que el sistema encuentra solo.",
              ]}
              benefit="Ganas ver de un vistazo cómo vas, sin sumar nada a mano."
            />
          </div>
          {cycles && cycles.length > 0 && (
            <div className="flex items-center gap-2">
              <CycleSelector cycles={cycles} selectedCycleId={effectiveCycleId} onChange={setSelectedCycleId} />
              {isActiveCycle && (
                <span
                  className="rounded-lg px-3 py-1.5 text-xs font-bold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  Activo
                </span>
              )}
            </div>
          )}
        </div>

        {isActiveCycle && effectiveCycleId && <NextCycleFocusBanner activeCycleId={effectiveCycleId} />}

        <ResonanceQuickStrip
          activeCommitmentsCount={activeCommitmentsCount}
          caidaChainsCount={caidaChainsCount}
          onOpenRecableado={openRecableado}
          onOpenCadena={openCadenaDeCaida}
        />

        {cyclesLoading && <p style={{ color: "var(--text-2)" }}>Cargando ciclos…</p>}
        {cyclesError && <p className="text-red-500">No se pudieron cargar los ciclos.</p>}
        {!cyclesLoading && cycles && cycles.length === 0 && (
          <p style={{ color: "var(--text-2)" }}>Todavía no hay ciclos creados.</p>
        )}
      </div>

      {/* Resonancia necesita más ancho que el resto de la página (Tarjeta A
          900px + Tarjeta B 440px + separación ya suman ~1360px) — por eso
          vive en su PROPIO contenedor centrado más ancho, no anidada dentro
          del `max-w-6xl` de arriba: metida ahí, flexbox la encogía por
          debajo de su tamaño real y todo (el cerebro, el hexágono, el
          anillo) se veía amontonado. */}
      {effectiveCycleId && (
        <div className="mx-auto mt-6 max-w-[1400px]">
          <ResonanceSection resonance={resonance} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}
    </div>
  );
}
