import { useState } from "react";
import type { CatalogHabit, CatalogStage } from "../api/habits";
import { useCompass, useSaveCompassProfile, type Compass } from "../api/compass";
import { useWoopPlans, type WoopPlan } from "../api/microActions";
import { AREA_IDENTITY_COMPASS_FIELD, DEFAULT_AREA_IDENTITY, type HabitCategory } from "../domain";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL, type BrainArea } from "./NeuralCore/brainTokens";
import { NEURAL_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_GOLD, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import { CATALOG_STAGE_COLOR, CATALOG_STAGE_LABEL, IDENTITY_AREA_ORDER, IDENTITY_REGION_LABEL, regionStrengthByArea } from "../lib/habitIdentity";
import { splitPlanThen } from "../lib/woopPlanText";

function summarizeDesire(text: string, max = 40): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max).trim()}…` : oneLine;
}

type HabitPrefill = { name: string; specification: string };

function HabitRing({ percent, color }: { percent: number; color: string }) {
  return (
    <span className="relative inline-flex h-[26px] w-[26px] shrink-0 rounded-full" style={{ background: `conic-gradient(${color} ${percent}%, rgba(255,255,255,.12) 0)` }}>
      <span className="absolute inset-[3px] rounded-full" style={{ background: "#0B0F28" }} />
    </span>
  );
}

function StageTag({ stage }: { stage: CatalogStage }) {
  if (stage === "automatico") {
    return (
      <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: NEURAL_GOLD, color: "#3A2E05" }}>
        {CATALOG_STAGE_LABEL[stage]}
      </span>
    );
  }
  return (
    <span className="shrink-0 text-xs font-bold" style={{ color: CATALOG_STAGE_COLOR[stage] }}>
      {CATALOG_STAGE_LABEL[stage]}
    </span>
  );
}

function AreaIdentityPhrase({ category, compass }: { category: HabitCategory; compass: Compass | null | undefined }) {
  const [editing, setEditing] = useState(false);
  const field = AREA_IDENTITY_COMPASS_FIELD[category];
  const current = (compass?.[field] as string | null) ?? DEFAULT_AREA_IDENTITY[category];
  const [draft, setDraft] = useState(current);
  const saveProfile = useSaveCompassProfile();

  if (editing) {
    return (
      <div className="flex flex-wrap gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="font-reading min-w-0 flex-1 rounded-lg border p-2 text-base italic"
          style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT, fontFamily: "'Lora', Georgia, serif" }}
        />
        <button
          type="button"
          disabled={!draft.trim() || saveProfile.isPending}
          onClick={() => saveProfile.mutate({ [field]: draft.trim() }, { onSuccess: () => setEditing(false) })}
          className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50"
          style={{ background: NEURAL_CYAN, color: "#070B1F" }}
        >
          Guardar
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="text-left">
      <p className="font-reading m-0 text-[17px] italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT, lineHeight: 1.4 }}>
        {current}
      </p>
    </button>
  );
}

function RegionCard({
  category,
  habits,
  percent,
  compass,
  woopPlan,
  selected,
  dimmed,
  onOpenDetail,
  onCreateInArea,
}: {
  category: HabitCategory;
  habits: CatalogHabit[];
  percent: number | null;
  compass: Compass | null | undefined;
  // Un plan WOOP activo de esta área, sin ningún hábito todavía (la región
  // está vacía por definición si llegamos hasta acá) — Paso 4 del rediseño
  // de identidad: ofrece crear el primer hábito a partir del "entonces…".
  woopPlan: WoopPlan | null;
  selected: boolean;
  dimmed: boolean;
  onOpenDetail: (habitId: string) => void;
  onCreateInArea: (category: HabitCategory, prefill?: HabitPrefill) => void;
}) {
  const area = AREA_OF_CATEGORY[category];
  const color = BRAIN_AREA_COLOR[area];
  const empty = habits.length === 0;

  return (
    <div
      className="flex flex-col gap-3.5 rounded-2xl p-5 transition-opacity duration-300"
      style={{
        background: empty ? "transparent" : `linear-gradient(160deg, ${color}14, rgba(11,15,40,0.5))`,
        border: empty ? `1px dashed ${color}66` : `1px solid ${selected ? color : `${color}40`}`,
        borderWidth: selected && !empty ? 1.5 : undefined,
        opacity: dimmed ? 0.35 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[0.08em] uppercase" style={{ color }}>
          {BRAIN_AREA_LABEL[area]} · {IDENTITY_REGION_LABEL[category]}
        </span>
        <span className="font-display shrink-0 text-lg font-bold" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: percent === null ? NEURAL_TEXT_SECONDARY : NEURAL_TEXT }}>
          {percent === null ? "Sin encender" : `${percent}%`}
        </span>
      </div>

      <AreaIdentityPhrase category={category} compass={compass} />

      {!empty && (
        <>
          <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.1)" }}>
            <div className="h-full rounded-full" style={{ width: `${percent ?? 0}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
          </div>
          <ul className="flex flex-col gap-1">
            {habits.map((h) => (
              <li key={h.id}>
                <button type="button" onClick={() => onOpenDetail(h.id)} className="flex w-full items-center gap-2.5 rounded-lg py-1.5 text-left">
                  <HabitRing percent={h.percent} color={h.stage === "automatico" ? NEURAL_GOLD : color} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: NEURAL_TEXT }}>
                    {h.name}
                  </span>
                  <StageTag stage={h.stage} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {empty && (
        <div className="flex flex-col gap-2.5 rounded-xl border p-3.5" style={{ borderColor: `${color}40`, background: "rgba(255,255,255,.02)" }}>
          {woopPlan ? (
            <>
              <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Tu plan WOOP de {summarizeDesire(woopPlan.title ?? woopPlan.desire)} aún no tiene un hábito diario que lo empuje. Esta región está esperando su primer camino.
              </p>
              <button
                type="button"
                onClick={() => {
                  const { main } = splitPlanThen(woopPlan.planThen);
                  onCreateInArea(category, { name: main, specification: main });
                }}
                className="self-start rounded-xl px-3.5 py-2 text-sm font-bold"
                style={{ background: NEURAL_CYAN, color: "#070B1F" }}
              >
                + Crear hábito desde mi WOOP
              </button>
            </>
          ) : (
            <>
              <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Esta región aún no tiene hábitos. ¿Quién quieres ser aquí?
              </p>
              <button
                type="button"
                onClick={() => onCreateInArea(category)}
                className="self-start rounded-xl px-3.5 py-2 text-sm font-bold"
                style={{ background: NEURAL_CYAN, color: "#070B1F" }}
              >
                + Crear el primero
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Rejilla 3x2 de "Hábitos por identidad" (mockups 16e/16h, Paso 4) — orden
 * fijo Mental/Económica/Habilidades/Emocional/Física/Espiritual.
 */
export function HabitIdentityGrid({
  habits,
  selectedArea,
  onOpenDetail,
  onCreateInArea,
}: {
  habits: CatalogHabit[];
  selectedArea: BrainArea | null;
  onOpenDetail: (habitId: string) => void;
  onCreateInArea: (category: HabitCategory, prefill?: HabitPrefill) => void;
}) {
  const { data: compass } = useCompass();
  const { data: woopPlans } = useWoopPlans();
  const strengths = regionStrengthByArea(habits);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {IDENTITY_AREA_ORDER.map((category) => {
        const area = AREA_OF_CATEGORY[category];
        const habitsInArea = habits.filter((h) => h.category === category && h.active).sort((a, b) => a.sortOrder - b.sortOrder);
        // Un plan WOOP de esta área sirve de "caso especial" solo si la
        // región sigue vacía (sin hábitos ya es, por definición, "sin un
        // hábito asociado" — ver comentario en schema.prisma de WoopPlan).
        const woopPlan = habitsInArea.length === 0 ? (woopPlans ?? []).find((p) => p.area === category) ?? null : null;
        return (
          <RegionCard
            key={category}
            category={category}
            habits={habitsInArea}
            percent={strengths[category].percent}
            compass={compass}
            woopPlan={woopPlan}
            selected={selectedArea === area}
            dimmed={selectedArea !== null && selectedArea !== area}
            onOpenDetail={onOpenDetail}
            onCreateInArea={onCreateInArea}
          />
        );
      })}
    </div>
  );
}
