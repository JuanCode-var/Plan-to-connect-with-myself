import { useNextCycleFocus, useSetNextCycleFocus } from "../../api/profile";
import { AREA_OF_CATEGORY, BRAIN_AREA_LABEL } from "../NeuralCore/brainTokens";
import { FUTURE_IDENTITY_CLAUSE } from "./versionesTokens";

/**
 * "GUARDA esa intención... y muéstrala al iniciar el siguiente ciclo"
 * (sección 4 de "Versiones de ti") — vive en Dashboard.tsx (no dentro de
 * ResonanceSection) porque tiene que aparecer apenas el ciclo activo YA NO
 * es aquel en el que se eligió la región; mismo criterio de banner que
 * WoopReminderBanner.tsx (sin bandeja de notificaciones real en la app, ver
 * ResonanceSection.tsx). De un solo uso: "Entendido" limpia la intención en
 * el servidor.
 */
export function NextCycleFocusBanner({ activeCycleId }: { activeCycleId: string }) {
  const { data } = useNextCycleFocus();
  const clearFocus = useSetNextCycleFocus();

  if (!data?.area || data.setInCycleId === activeCycleId) return null;

  const area = AREA_OF_CATEGORY[data.area];

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-[18px] py-4"
      style={{ background: "rgba(124,92,255,0.10)", borderColor: "rgba(124,92,255,0.4)" }}
    >
      <p className="m-0 text-sm font-semibold" style={{ color: "#7C5CFF" }}>
        Al cerrar tu ciclo anterior elegiste encender <strong>{BRAIN_AREA_LABEL[area]}</strong> en este — "Ya eres alguien que{" "}
        {FUTURE_IDENTITY_CLAUSE[area]}."
      </p>
      <button
        type="button"
        onClick={() => clearFocus.mutate({ area: null, cycleId: null })}
        disabled={clearFocus.isPending}
        className="rounded-full px-4 py-1.5 text-xs font-bold disabled:opacity-60"
        style={{ background: "#7C5CFF", color: "#070B1F" }}
      >
        Entendido
      </button>
    </div>
  );
}
