import type { CatalogHabit } from "../api/habits";
import { BRAIN_AREA_COLOR } from "./NeuralCore/brainTokens";
import { NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_LAVENDER, NEURAL_TEXT } from "./NeuralCore/tokens";
import { topIdentityPhrases } from "../lib/habitIdentity";

function lowerFirst(s: string): string {
  return s.length > 0 ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/**
 * "Ya eres alguien que..." (mockup 13/13b) — hasta 3 hábitos con
 * `meConvierteEn` y fuerza ≥85%, el más fuerte primero. Misma fuente que el
 * hero de "Hábitos por identidad" (ver lib/habitIdentity.ts, Paso 6 del
 * rediseño de identidad: unificar esta frase en toda la app) — antes esto
 * usaba `habit.name` + impulsos de por vida, un cálculo propio y aparte.
 */
export function CompassAchievements({ habits }: { habits: CatalogHabit[] }) {
  const featured = topIdentityPhrases(habits);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl p-5" style={{ background: NEURAL_CARD_BG, border: `1px solid ${NEURAL_CARD_BORDER}` }}>
      <span className="text-xs font-bold tracking-wide uppercase" style={{ color: NEURAL_LAVENDER, letterSpacing: "1.5px" }}>
        Ya eres alguien que…
      </span>
      {featured.length === 0 ? (
        <p className="m-0 text-sm italic" style={{ color: NEURAL_TEXT }}>
          Todavía ningún hábito con "me convierte en" llegó al 85% — sigue sosteniéndolos.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {featured.map((p) => {
            const color = BRAIN_AREA_COLOR[p.area];
            return (
              <div
                key={p.habitId}
                className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5"
                style={{ background: `${color}14`, border: `1px solid ${color}66` }}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                  <span className="truncate font-reading text-base italic" style={{ color: NEURAL_TEXT }}>
                    …{lowerFirst(p.phrase)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold" style={{ color }}>
                  {p.percent}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
