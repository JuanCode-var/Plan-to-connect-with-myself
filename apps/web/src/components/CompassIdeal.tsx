import { useState } from "react";
import { useSaveIdentities, type Identity } from "../api/compass";
import type { HabitIdentityStat } from "../api/habits";
import type { HabitCategory } from "../domain";
import { NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

// Frase-semilla por categoría del hábito con más impulsos de toda la vida —
// una sola por categoría, elegida a mano para sonar natural en "Soy alguien
// que...". Nunca se inventa una frase a partir del NOMBRE del hábito (podría
// quedar gramaticalmente roto para cualquier hábito real) — se ofrece esta
// plantilla fija como punto de partida, el usuario la edita o la ignora.
const CATEGORY_SEED: Record<HabitCategory, string> = {
  FISICO: "Soy alguien que se entrena cada día",
  ECONOMICO: "Soy alguien que cuida su futuro",
  MENTAL: "Soy alguien que invierte en su mente",
  EMOCIONAL: "Soy alguien que se conoce a sí mismo",
  HABILIDADES: "Soy alguien que nunca deja de aprender",
  ESPIRITUAL: "Soy alguien en paz con quien es",
};

/** Hasta 3 sugerencias reales (nunca inventadas): una por Mi Palabra activa, una por el hábito con más impulsos de toda la vida, una genérica de respaldo. */
function buildSeeds(hasActiveCommitment: boolean, topHabit: HabitIdentityStat | undefined): string[] {
  const seeds: string[] = [];
  if (hasActiveCommitment) seeds.push("Soy alguien que cumple su palabra");
  if (topHabit) seeds.push(CATEGORY_SEED[topHabit.category]);
  if (seeds.length < 2) seeds.push("Soy alguien que se levanta después de caer");
  return Array.from(new Set(seeds)).slice(0, 3);
}

/** "Mi ideal · la persona que estoy construyendo" (mockup 13/13b) — una sola frase (identities[0]), no la lista vieja de varias identidades. */
export function CompassIdeal({
  identity,
  hasActiveCommitment,
  topHabit,
}: {
  identity: Identity | undefined;
  hasActiveCommitment: boolean;
  topHabit: HabitIdentityStat | undefined;
}) {
  const [editing, setEditing] = useState(!identity);
  const [statement, setStatement] = useState(identity?.statement ?? "");
  const save = useSaveIdentities();

  function handleSave() {
    if (!statement.trim()) return;
    save.mutate([{ statement: statement.trim(), why: identity?.why ?? "" }], { onSuccess: () => setEditing(false) });
  }

  const seeds = buildSeeds(hasActiveCommitment, topHabit);

  return (
    <div className="flex flex-col gap-3 rounded-2xl p-6" style={{ background: NEURAL_CARD_BG, border: `1px solid ${NEURAL_CARD_BORDER}` }}>
      <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1.5px" }}>
        Mi ideal · la persona que estoy construyendo
      </span>

      {!editing && identity ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="m-0 font-reading text-2xl italic" style={{ color: NEURAL_TEXT, maxWidth: 760 }}>
            “{identity.statement}”
          </p>
          <button
            type="button"
            onClick={() => {
              setStatement(identity.statement);
              setEditing(true);
            }}
            className="shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: "rgba(34,211,238,.35)", color: NEURAL_CYAN }}
          >
            Editar
          </button>
        </div>
      ) : (
        <>
          <p className="m-0 text-base" style={{ color: NEURAL_TEXT }}>
            Escribe en una frase, en presente, quién quieres ser. Tus mensajes de la app la usarán.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="flex-1 rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.14)", color: NEURAL_TEXT }}
              placeholder="Soy alguien que…"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              disabled={save.isPending || !statement.trim()}
              onClick={handleSave}
              className="shrink-0 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60"
              style={{ background: NEURAL_CYAN, color: "#070B1F" }}
            >
              {save.isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
          {seeds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Inspírate en lo que ya eres:
              </span>
              {seeds.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setStatement(seed)}
                  className="rounded-full border px-3 py-1.5 text-sm"
                  style={{ borderColor: "rgba(255,255,255,0.18)", color: NEURAL_TEXT_SECONDARY }}
                >
                  {seed}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
