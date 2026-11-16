import { useState } from "react";
import { NEURAL_CYAN, NEURAL_BG, NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
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
import { useCreateHabit } from "../api/habits";
import { useCompass } from "../api/compass";
import { WeekdaySelector } from "./WeekdaySelector";

export function HabitForm({
  onCreated,
  initialCategory,
  initialName,
  initialSpecification,
}: {
  onCreated?: () => void;
  // "+ Crear el primero" de una región vacía (Paso 4 del rediseño de
  // identidad) llega con el área ya elegida, para no hacer repetir ese paso.
  initialCategory?: HabitCategory;
  // "+ Crear hábito desde mi WOOP" (misma región, cuando hay un plan sin
  // hábito asociado): llega con el "entonces…" del plan ya limpio, como
  // punto de partida editable — nunca se guarda tal cual sin que la persona
  // lo revise primero.
  initialName?: string;
  initialSpecification?: string;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [meConvierteEn, setMeConvierteEn] = useState("");
  const [moment, setMoment] = useState<HabitMoment>("MANANA");
  const [category, setCategory] = useState<HabitCategory>(initialCategory ?? "FISICO");
  const [priority, setPriority] = useState<HabitPriorityLevel>("MEDIA");
  const [specification, setSpecification] = useState(initialSpecification ?? "");
  const [identityId, setIdentityId] = useState("");
  const [minimalVersion, setMinimalVersion] = useState("");
  const [activeWeekdays, setActiveWeekdays] = useState<number[] | null>(null);
  const createHabit = useCreateHabit();
  const { data: compass } = useCompass();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !specification.trim()) return;
    createHabit.mutate(
      {
        name: name.trim(),
        meConvierteEn: meConvierteEn.trim() || null,
        moment,
        category,
        priority,
        specification: specification.trim(),
        identityId: identityId || null,
        minimalVersion: minimalVersion.trim() || null,
        activeWeekdays,
      },
      {
        onSuccess: () => {
          setName("");
          setMeConvierteEn("");
          setSpecification("");
          setIdentityId("");
          setMinimalVersion("");
          setActiveWeekdays(null);
          onCreated?.();
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-expand-in flex flex-col gap-3 rounded-xl border p-4"
      style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER }}
    >
      <h2 className="font-display font-semibold">Nuevo hábito</h2>

      <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Nombre
        <input
          className="rounded-lg border p-2"
          style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
        ¿En quién te convierte este hábito?
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Alguien que…
          </span>
          <input
            className="min-w-0 flex-1 rounded-lg border p-2"
            style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
            value={meConvierteEn}
            onChange={(e) => setMeConvierteEn(e.target.value)}
            placeholder="madruga, entrena todos los días…"
          />
        </div>
      </label>

      <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Momento del día
        <select
          className="rounded-lg border p-2"
          style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
          value={moment}
          onChange={(e) => setMoment(e.target.value as HabitMoment)}
        >
          {HABIT_MOMENTS.map((m) => (
            <option key={m} value={m}>
              {HABIT_MOMENT_LABELS[m]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Categoría
        <select
          className="rounded-lg border p-2"
          style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
          value={category}
          onChange={(e) => setCategory(e.target.value as HabitCategory)}
        >
          {HABIT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {HABIT_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Prioridad
        <select
          className="rounded-lg border p-2"
          style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
          value={priority}
          onChange={(e) => setPriority(e.target.value as HabitPriorityLevel)}
        >
          {HABIT_PRIORITY_LEVELS.map((p) => (
            <option key={p} value={p}>
              {HABIT_PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Especificación
        <textarea
          className="rounded-lg border p-2"
          style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
          value={specification}
          onChange={(e) => setSpecification(e.target.value)}
          rows={2}
          required
        />
      </label>

      <div className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Días de la semana
        <WeekdaySelector value={activeWeekdays} onChange={setActiveWeekdays} />
      </div>

      {compass && compass.identities.length > 0 && (
        <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          ¿A qué versión de ti le sirve este hábito? (opcional)
          <select
            className="rounded-lg border p-2"
            style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
            value={identityId}
            onChange={(e) => setIdentityId(e.target.value)}
          >
            <option value="">Sin vincular</option>
            {compass.identities.map((i) => (
              <option key={i.id} value={i.id}>
                {i.statement}
              </option>
            ))}
          </select>
        </label>
      )}

      {identityId && (
        <label className="flex flex-col gap-1 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Versión mínima (2 minutos, opcional)
          <input
            className="rounded-lg border p-2"
            style={{ background: NEURAL_BG, borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
            value={minimalVersion}
            onChange={(e) => setMinimalVersion(e.target.value)}
            placeholder="Lo más chico que podrías hacer si hoy no da para más"
          />
        </label>
      )}

      <button
        type="submit"
        disabled={createHabit.isPending}
        className="self-start rounded-lg px-3 py-1.5 text-sm font-semibold"
        style={{ background: NEURAL_CYAN, color: NEURAL_BG }}
      >
        Crear hábito
      </button>
    </form>
  );
}
