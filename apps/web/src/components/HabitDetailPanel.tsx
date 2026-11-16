import { useEffect, useState } from "react";
import type { CatalogHabit, CatalogStage } from "../api/habits";
import { useCreateHabit, useUpdateHabit } from "../api/habits";
import {
  HABIT_CATEGORIES,
  HABIT_CATEGORY_LABELS,
  HABIT_MOMENTS,
  HABIT_MOMENT_LABELS,
  HABIT_PRIORITY_LEVELS,
  HABIT_PRIORITY_LABELS,
  type HabitCategory,
  type HabitMoment,
  type HabitPriorityLevel,
} from "../domain";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL } from "./NeuralCore/brainTokens";
import { NEURAL_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import { CATALOG_STAGE_COLOR, CATALOG_STAGE_LABEL, IDENTITY_REGION_LABEL } from "../lib/habitIdentity";
import { WeekdaySelector } from "./WeekdaySelector";

const AUTOMATIC_THRESHOLD_DAYS = 66;

const NEURO_TEXT: Record<CatalogStage, string> = {
  automatico: "Este camino ya está mielinizado: lo haces casi sin pensar. Ahora libera energía para tus hábitos nuevos.",
  consolidado: "Cada repetición recubre este camino de mielina: el impulso viaja más rápido y te cuesta menos.",
  sendero: "El camino ya existe, pero aún pide esfuerzo. La constancia de estas semanas es la que lo consolida.",
  chispa: "El camino ya existe, pero aún pide esfuerzo. La constancia de estas semanas es la que lo consolida.",
  poda: "El cerebro debilita lo que no usa, pero lo reactiva rápido. Hazlo tan pequeño que no puedas fallar.",
  nuevo: "Cada hábito nuevo abre un camino — las primeras repeticiones son las que más cuestan.",
};

const fieldStyle = { background: NEURAL_BG, border: `1px solid ${NEURAL_CARD_BORDER}`, color: NEURAL_TEXT };

function EditHabitForm({ habit, onDone }: { habit: CatalogHabit; onDone: () => void }) {
  const [name, setName] = useState(habit.name);
  const [meConvierteEn, setMeConvierteEn] = useState(habit.meConvierteEn ?? "");
  const [category, setCategory] = useState<HabitCategory>(habit.category);
  const [priority, setPriority] = useState<HabitPriorityLevel>(habit.priority);
  const [moment, setMoment] = useState<HabitMoment>(habit.moment);
  const [specification, setSpecification] = useState(habit.specification);
  const [minimalVersion, setMinimalVersion] = useState(habit.minimalVersion ?? "");
  const [activeWeekdays, setActiveWeekdays] = useState<number[] | null>(habit.activeWeekdays);
  const updateHabit = useUpdateHabit();

  function handleSave() {
    if (!name.trim()) return;
    updateHabit.mutate(
      {
        id: habit.id,
        data: {
          name: name.trim(),
          meConvierteEn: meConvierteEn.trim() || null,
          category,
          priority,
          moment,
          specification,
          minimalVersion: minimalVersion.trim() || null,
          activeWeekdays,
        },
      },
      { onSuccess: onDone },
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <input className="rounded-lg border p-2.5 text-sm font-semibold" style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} />
      <label className="flex flex-col gap-1 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        ¿En quién te convierte este hábito?
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Alguien que…
          </span>
          <input className="min-w-0 flex-1 rounded-lg border p-2 text-sm" style={fieldStyle} value={meConvierteEn} onChange={(e) => setMeConvierteEn(e.target.value)} />
        </div>
      </label>
      <label className="flex flex-col gap-1 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Área
        <select className="rounded-lg border p-2 text-sm" style={fieldStyle} value={category} onChange={(e) => setCategory(e.target.value as HabitCategory)}>
          {HABIT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {HABIT_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Prioridad
        <select className="rounded-lg border p-2 text-sm" style={fieldStyle} value={priority} onChange={(e) => setPriority(e.target.value as HabitPriorityLevel)}>
          {HABIT_PRIORITY_LEVELS.map((p) => (
            <option key={p} value={p}>
              {HABIT_PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Momento del día
        <select className="rounded-lg border p-2 text-sm" style={fieldStyle} value={moment} onChange={(e) => setMoment(e.target.value as HabitMoment)}>
          {HABIT_MOMENTS.map((m) => (
            <option key={m} value={m}>
              {HABIT_MOMENT_LABELS[m]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Por qué lo hago
        <textarea className="rounded-lg border p-2 text-sm" style={fieldStyle} rows={2} value={specification} onChange={(e) => setSpecification(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Versión mínima (2 minutos, opcional)
        <input className="rounded-lg border p-2 text-sm" style={fieldStyle} value={minimalVersion} onChange={(e) => setMinimalVersion(e.target.value)} />
      </label>
      <div className="flex flex-col gap-1 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Días de la semana
        <WeekdaySelector value={activeWeekdays} onChange={setActiveWeekdays} />
      </div>
      <div className="mt-1 flex gap-2">
        <button type="button" onClick={handleSave} disabled={updateHabit.isPending || !name.trim()} className="rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-60" style={{ background: NEURAL_CYAN, color: "#070B1F" }}>
          Guardar
        </button>
        <button type="button" onClick={onDone} className="rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT_SECONDARY }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ThirtyDayGrid({ last30, color }: { last30: boolean[]; color: string }) {
  return (
    <div className="grid grid-cols-10 gap-1.5">
      {last30.map((done, i) => (
        <span key={i} className="aspect-square rounded-[3px]" style={{ background: done ? color : "rgba(255,255,255,.08)" }} />
      ))}
    </div>
  );
}

/**
 * Panel de detalle de un hábito (mockups 16f/16g, Paso 5) — único en toda la
 * sección: lo abren tanto la vista "Por identidad" como "Por momento del
 * día" (antes esa segunda tenía su propio detalle inline, ver HabitRow.tsx).
 */
export function HabitDetailPanel({ habit, onClose }: { habit: CatalogHabit; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const [changingHour, setChangingHour] = useState(false);
  const [minimalVersionDraft, setMinimalVersionDraft] = useState("");
  const [meConvierteEnDraft, setMeConvierteEnDraft] = useState("");

  const updateHabit = useUpdateHabit();
  const createHabit = useCreateHabit();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const area = AREA_OF_CATEGORY[habit.category];
  const areaColor = BRAIN_AREA_COLOR[area];
  const stageColor = CATALOG_STAGE_COLOR[habit.stage];

  function saveMeConvierteEn() {
    if (!meConvierteEnDraft.trim()) return;
    updateHabit.mutate({ id: habit.id, data: { meConvierteEn: meConvierteEnDraft.trim() } });
  }

  function createMinimalVersionHabit(text: string) {
    createHabit.mutate({
      name: text,
      specification: text,
      category: habit.category,
      priority: habit.priority,
      moment: habit.moment,
    });
  }

  function handleCreateTwoMinuteVersion() {
    if (habit.minimalVersion) {
      createMinimalVersionHabit(habit.minimalVersion);
    } else if (minimalVersionDraft.trim()) {
      updateHabit.mutate({ id: habit.id, data: { minimalVersion: minimalVersionDraft.trim() } });
      createMinimalVersionHabit(minimalVersionDraft.trim());
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" style={{ background: "rgba(4,6,20,.55)" }} onClick={onClose} />
      <aside
        className="habit-panel-in absolute top-0 right-0 flex h-full w-full flex-col gap-5 overflow-y-auto p-6 sm:w-[440px] sm:p-7"
        style={{ background: "linear-gradient(180deg, #0B0F28, #070A1C)", borderLeft: `1px solid ${NEURAL_CARD_BORDER}`, boxShadow: "-24px 0 60px rgba(0,0,0,.45)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold tracking-[0.1em] uppercase" style={{ color: areaColor }}>
            {BRAIN_AREA_LABEL[area]} · {IDENTITY_REGION_LABEL[habit.category]}
          </span>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg" style={{ color: NEURAL_TEXT_SECONDARY }}>
            ✕
          </button>
        </div>

        {editing ? (
          <EditHabitForm habit={habit} onDone={() => setEditing(false)} />
        ) : (
          <>
            <h2 className="font-display m-0 text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: NEURAL_TEXT }}>
              {habit.name}
            </h2>

            <div className="flex flex-col gap-1.5 rounded-xl p-4" style={{ background: `${areaColor}10`, border: `1px solid ${areaColor}30` }}>
              <span className="text-xs font-bold tracking-[0.08em] uppercase" style={{ color: NEURAL_LAVENDER }}>
                Me convierte en alguien que…
              </span>
              {habit.meConvierteEn ? (
                <p className="font-reading m-0 text-2xl italic" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT, lineHeight: 1.35 }}>
                  {habit.meConvierteEn}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <input
                    value={meConvierteEnDraft}
                    onChange={(e) => setMeConvierteEnDraft(e.target.value)}
                    placeholder="Alguien que…"
                    className="min-w-0 flex-1 rounded-lg border p-2 text-base"
                    style={fieldStyle}
                  />
                  <button
                    type="button"
                    disabled={!meConvierteEnDraft.trim() || updateHabit.isPending}
                    onClick={saveMeConvierteEn}
                    className="shrink-0 rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50"
                    style={{ background: NEURAL_CYAN, color: "#070B1F" }}
                  >
                    Guardar
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold tracking-[0.08em] uppercase" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Por qué lo hago
              </span>
              <p className="font-reading m-0 text-base" style={{ fontFamily: "'Lora', Georgia, serif", color: NEURAL_TEXT, lineHeight: 1.5 }}>
                {habit.specification}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-[0.08em] uppercase" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  Últimos 30 días
                </span>
                <span className="text-sm font-bold" style={{ color: stageColor }}>
                  {CATALOG_STAGE_LABEL[habit.stage]} · {habit.percent}%
                </span>
              </div>
              <ThirtyDayGrid last30={habit.last30} color={areaColor} />
              <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                {habit.stage === "automatico"
                  ? `Ya es automático. Lo hiciste ${habit.lifetimeDone} días.`
                  : `Llevas ${habit.lifetimeDone} de ${AUTOMATIC_THRESHOLD_DAYS} días para volverlo automático.`}
              </p>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl p-3.5" style={{ background: "rgba(196,181,253,.08)", border: "1px solid rgba(196,181,253,.2)" }}>
              <span className="shrink-0 text-xs font-bold" style={{ color: NEURAL_LAVENDER }}>
                🧠 NEURO
              </span>
              <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY, lineHeight: 1.5 }}>
                {NEURO_TEXT[habit.stage]}
              </p>
            </div>

            {habit.stage === "poda" && (
              <div className="flex flex-col gap-2.5">
                {!habit.minimalVersion && (
                  <input
                    value={minimalVersionDraft}
                    onChange={(e) => setMinimalVersionDraft(e.target.value)}
                    placeholder="La versión de 2 minutos (lo más chico que podrías hacer)"
                    className="rounded-lg border p-2.5 text-sm"
                    style={fieldStyle}
                  />
                )}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    disabled={(!habit.minimalVersion && !minimalVersionDraft.trim()) || createHabit.isPending}
                    onClick={handleCreateTwoMinuteVersion}
                    className="rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50"
                    style={{ background: NEURAL_CYAN, color: "#070B1F" }}
                  >
                    {createHabit.isPending ? "Creando…" : "Crear versión de 2 minutos"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangingHour((v) => !v)}
                    className="rounded-xl border px-4 py-2.5 text-sm font-bold"
                    style={{ borderColor: "rgba(34,211,238,.45)", color: NEURAL_CYAN }}
                  >
                    Cambiar la hora
                  </button>
                </div>
                {createHabit.isSuccess && (
                  <p className="m-0 text-xs font-semibold" style={{ color: "#FDE68A" }}>
                    ✓ Versión de 2 minutos creada — ya aparece en tus hábitos.
                  </p>
                )}
                {changingHour && (
                  <div className="flex flex-wrap gap-2">
                    {HABIT_MOMENTS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          updateHabit.mutate({ id: habit.id, data: { moment: m } });
                          setChangingHour(false);
                        }}
                        className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                        style={m === habit.moment ? { background: NEURAL_CYAN, borderColor: NEURAL_CYAN, color: "#070B1F" } : { borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                      >
                        {HABIT_MOMENT_LABELS[m]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto flex gap-2.5 border-t pt-5" style={{ borderColor: NEURAL_CARD_BORDER }}>
              <button type="button" onClick={() => setEditing(true)} className="rounded-xl border px-4 py-2.5 text-sm font-bold" style={{ borderColor: "rgba(34,211,238,.45)", color: NEURAL_CYAN }}>
                Editar
              </button>
              <button
                type="button"
                onClick={() => updateHabit.mutate({ id: habit.id, data: { active: !habit.active } })}
                className="rounded-xl border px-4 py-2.5 text-sm font-bold"
                style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT_SECONDARY }}
              >
                {habit.active ? "Pausar" : "Reanudar"}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
