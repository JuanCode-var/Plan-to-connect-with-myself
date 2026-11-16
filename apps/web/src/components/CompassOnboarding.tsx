import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCompleteIdentityOnboarding,
  useSaveCompassProfile,
  useSaveWeaknesses,
  type Compass,
  type WeaknessInput,
} from "../api/compass";
import { showToast } from "../lib/toast";
import { NEURAL_BG, NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

const STEPS = ["intro", "autoconocimiento", "valores", "proposito", "listo"] as const;
type Step = (typeof STEPS)[number];

function splitValues(text: string): string[] {
  return text.split("\n").map((v) => v.trim()).filter(Boolean);
}

/**
 * Cuestionario de identidad — 100% obligatorio después de registrarse (ver
 * RequireAuth.tsx: no hay forma de llegar al resto de la app sin pasar por
 * acá). A diferencia de la primera versión, guarda progreso AL PASAR DE
 * CADA PASO (no todo junto al final): si se cierra la pestaña a mitad de
 * camino, `compass` ya trae lo guardado hasta ahí y los campos arrancan
 * precargados en vez de en blanco. Sin "Saltar" — es justamente el punto de
 * que sea obligatorio.
 */
export function CompassOnboarding({ compass }: { compass: Compass | null }) {
  const [step, setStep] = useState<Step>("intro");
  const navigate = useNavigate();

  const [uniqueness, setUniqueness] = useState(compass?.uniqueness ?? "");
  const [enjoy, setEnjoy] = useState(compass?.enjoyWithoutBeingAsked ?? "");
  const [strengths, setStrengths] = useState(compass?.strengths ?? "");
  const [weaknesses, setWeaknesses] = useState<WeaknessInput[]>(
    compass && compass.weaknesses.length > 0
      ? compass.weaknesses.map((w) => ({ text: w.text, counterMessage: w.counterMessage ?? "" }))
      : [{ text: "", counterMessage: "" }],
  );

  const [values, setValues] = useState<string[]>(() => {
    const existing = splitValues(compass?.coreValues ?? "");
    return existing.length > 0 ? existing : [""];
  });
  const [limiting, setLimiting] = useState(compass?.limitingBeliefs ?? "");
  const [reprogram, setReprogram] = useState(compass?.beliefsToReprogram ?? "");
  const [empowering, setEmpowering] = useState(compass?.empoweringBeliefs ?? "");

  const [cause, setCause] = useState(compass?.cause ?? "");
  const [impact, setImpact] = useState(compass?.impact ?? "");
  const [howToLiveDays, setHowToLiveDays] = useState(compass?.howToLiveDays ?? "");

  const saveProfile = useSaveCompassProfile();
  const saveWeaknesses = useSaveWeaknesses();
  const completeOnboarding = useCompleteIdentityOnboarding();
  const busy = saveProfile.isPending || saveWeaknesses.isPending || completeOnboarding.isPending;

  const autoconocimientoValid =
    uniqueness.trim().length > 0 &&
    enjoy.trim().length > 0 &&
    strengths.trim().length > 0 &&
    weaknesses.some((w) => w.text.trim().length > 0);
  const valoresValid =
    values.some((v) => v.trim().length > 0) &&
    limiting.trim().length > 0 &&
    reprogram.trim().length > 0 &&
    empowering.trim().length > 0;
  const propositoValid = cause.trim().length > 0 && impact.trim().length > 0 && howToLiveDays.trim().length > 0;

  async function handleNextFromAutoconocimiento() {
    if (!autoconocimientoValid) return;
    try {
      await saveProfile.mutateAsync({ uniqueness, enjoyWithoutBeingAsked: enjoy, strengths });
      const items = weaknesses.map((w) => ({ text: w.text.trim(), counterMessage: w.counterMessage.trim() })).filter((w) => w.text.length > 0);
      await saveWeaknesses.mutateAsync(items);
      setStep("valores");
    } catch {
      showToast("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    }
  }

  async function handleNextFromValores() {
    if (!valoresValid) return;
    try {
      const coreValues = values.map((v) => v.trim()).filter(Boolean).join("\n");
      await saveProfile.mutateAsync({ coreValues, limitingBeliefs: limiting, beliefsToReprogram: reprogram, empoweringBeliefs: empowering });
      setStep("proposito");
    } catch {
      showToast("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    }
  }

  async function handleFinish() {
    if (!propositoValid) return;
    try {
      await saveProfile.mutateAsync({ cause, impact, howToLiveDays });
      await completeOnboarding.mutateAsync();
      navigate("/tracker", { replace: true });
    } catch {
      showToast("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    }
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-10">
      <div className="flex items-center justify-center gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className="h-1.5 rounded-full transition-all duration-200"
            style={{ width: i === stepIndex ? 24 : 8, background: i <= stepIndex ? NEURAL_CYAN : NEURAL_CARD_BORDER }}
          />
        ))}
      </div>

      <div
        className="panel-card-in flex flex-col gap-5 rounded-2xl border p-6 sm:p-8"
        style={{ background: NEURAL_CARD_BG, borderColor: NEURAL_CARD_BORDER }}
      >
        {step === "intro" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <h1 className="font-display text-2xl font-bold">Antes de nada, quiero conocerte</h1>
            <p className="font-reading text-base leading-relaxed" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Esto no es un formulario más — es el espejo al que vas a volver cada vez que dudes de quién eres.
              Lo que escribas acá es lo que de ahora en más va a usar la app para recordarte, con tus propias
              palabras, por qué sigues cuando se pone difícil. No hay respuesta correcta, solo la tuya — tómate
              el tiempo que necesites.
            </p>
          </div>
        )}

        {step === "autoconocimiento" && (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-xl font-bold">Autoconocimiento</h2>
              <p className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                Sin vueltas, como lo piensas de verdad.
              </p>
            </div>
            <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              ¿Qué me hace único?
              <textarea
                value={uniqueness}
                onChange={(e) => setUniqueness(e.target.value)}
                rows={2}
                className="font-reading resize-y rounded-lg border bg-transparent p-2.5"
                style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              ¿Qué disfruto hacer sin que me lo pidan?
              <textarea
                value={enjoy}
                onChange={(e) => setEnjoy(e.target.value)}
                rows={2}
                className="font-reading resize-y rounded-lg border bg-transparent p-2.5"
                style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              ¿Qué fortalezas reconozco en mí?
              <textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                rows={2}
                className="font-reading resize-y rounded-lg border bg-transparent p-2.5"
                style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              />
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                ¿Qué debilidades acepto y estoy trabajando?
              </span>
              <p className="rounded-lg border-l-2 pl-3 text-xs leading-relaxed" style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT_SECONDARY }}>
                Una debilidad real es algo concreto que te hace fallar un hábito o ceder cuando no querías — no
                "soy desordenado", sino lo específico que se repite. El contramensaje es lo que tú mismo te
                dices para retomar el control justo en ese momento: no una frase linda, una que de verdad te
                mueva cuando la leas con la guardia baja. Puedes dejarlo en blanco y volver más adelante.
              </p>
              {weaknesses.map((w, i) => (
                <div key={i} className="flex flex-col gap-1.5 rounded-lg border p-3" style={{ borderColor: NEURAL_CARD_BORDER }}>
                  <input
                    type="text"
                    value={w.text}
                    onChange={(e) => {
                      const next = [...weaknesses];
                      next[i] = { ...next[i], text: e.target.value };
                      setWeaknesses(next);
                    }}
                    placeholder="Ej: ceder a un impulso apenas aparece"
                    className="font-display rounded-lg border bg-transparent p-2 font-semibold"
                    style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                  />
                  <textarea
                    value={w.counterMessage}
                    onChange={(e) => {
                      const next = [...weaknesses];
                      next[i] = { ...next[i], counterMessage: e.target.value };
                      setWeaknesses(next);
                    }}
                    placeholder="Lo que necesitas leer en ese momento exacto (opcional)"
                    rows={2}
                    className="font-reading resize-y rounded-lg border bg-transparent p-2 text-sm"
                    style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT_SECONDARY }}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setWeaknesses([...weaknesses, { text: "", counterMessage: "" }])}
                className="self-start text-xs font-semibold underline underline-offset-2"
                style={{ color: NEURAL_TEXT_SECONDARY }}
              >
                + Agregar otra
              </button>
            </div>
          </>
        )}

        {step === "valores" && (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-xl font-bold">Valores y Creencias</h2>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                ¿Qué 5 valores rigen mi vida?
              </span>
              {values.map((v, i) => (
                <input
                  key={i}
                  type="text"
                  value={v}
                  onChange={(e) => {
                    const next = [...values];
                    next[i] = e.target.value;
                    setValues(next);
                  }}
                  placeholder={`Valor ${i + 1}`}
                  className="rounded-lg border bg-transparent p-2 text-sm"
                  style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
                />
              ))}
              {values.length < 5 && (
                <button
                  type="button"
                  onClick={() => setValues([...values, ""])}
                  className="self-start text-xs font-semibold underline underline-offset-2"
                  style={{ color: NEURAL_TEXT_SECONDARY }}
                >
                  + Agregar valor
                </button>
              )}
            </div>
            <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              ¿Qué creencias me están limitando?
              <textarea
                value={limiting}
                onChange={(e) => setLimiting(e.target.value)}
                rows={2}
                className="font-reading resize-y rounded-lg border bg-transparent p-2.5"
                style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              ¿Qué creencias elijo reprogramar?
              <textarea
                value={reprogram}
                onChange={(e) => setReprogram(e.target.value)}
                rows={2}
                className="font-reading resize-y rounded-lg border bg-transparent p-2.5"
                style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Nuevas creencias empoderadoras
              <textarea
                value={empowering}
                onChange={(e) => setEmpowering(e.target.value)}
                rows={2}
                className="font-reading resize-y rounded-lg border bg-transparent p-2.5"
                style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              />
            </label>
          </>
        )}

        {step === "proposito" && (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-xl font-bold">Propósito y Dirección</h2>
            </div>
            <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              ¿Qué causa me mueve?
              <textarea
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                rows={2}
                className="font-reading resize-y rounded-lg border bg-transparent p-2.5"
                style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              ¿Qué impacto quiero generar?
              <textarea
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                rows={2}
                className="font-reading resize-y rounded-lg border bg-transparent p-2.5"
                style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
              ¿Cómo quiero vivir mis días?
              <textarea
                value={howToLiveDays}
                onChange={(e) => setHowToLiveDays(e.target.value)}
                rows={2}
                className="font-reading resize-y rounded-lg border bg-transparent p-2.5"
                style={{ borderColor: NEURAL_CARD_BORDER, color: NEURAL_TEXT }}
              />
            </label>
          </>
        )}

        {step === "listo" && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <h2 className="font-display text-xl font-bold">Ya te conozco un poco mejor</h2>
            <p className="font-reading text-base leading-relaxed" style={{ color: NEURAL_TEXT_SECONDARY }}>
              Nada de esto queda fijo — puedes volver a Mi Identidad cuando quieras y reescribirlo. Pero de acá en
              más, cada vez que dudes o te cueste, la app va a tener tus propias palabras para recordarte quién
              dijiste que ibas a ser.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end pt-2">
          {step === "intro" && (
            <button
              type="button"
              onClick={() => setStep("autoconocimiento")}
              className="rounded-lg px-5 py-2 text-sm font-bold tracking-wide uppercase"
              style={{ background: NEURAL_CYAN, color: NEURAL_BG }}
            >
              Empezar
            </button>
          )}
          {step === "autoconocimiento" && (
            <button
              type="button"
              onClick={handleNextFromAutoconocimiento}
              disabled={!autoconocimientoValid || busy}
              className="rounded-lg px-5 py-2 text-sm font-bold tracking-wide uppercase disabled:opacity-50"
              style={{ background: NEURAL_CYAN, color: NEURAL_BG }}
            >
              {busy ? "Guardando…" : "Siguiente"}
            </button>
          )}
          {step === "valores" && (
            <button
              type="button"
              onClick={handleNextFromValores}
              disabled={!valoresValid || busy}
              className="rounded-lg px-5 py-2 text-sm font-bold tracking-wide uppercase disabled:opacity-50"
              style={{ background: NEURAL_CYAN, color: NEURAL_BG }}
            >
              {busy ? "Guardando…" : "Siguiente"}
            </button>
          )}
          {step === "proposito" && (
            <button
              type="button"
              onClick={() => setStep("listo")}
              disabled={!propositoValid}
              className="rounded-lg px-5 py-2 text-sm font-bold tracking-wide uppercase disabled:opacity-50"
              style={{ background: NEURAL_CYAN, color: NEURAL_BG }}
            >
              Siguiente
            </button>
          )}
          {step === "listo" && (
            <button
              type="button"
              onClick={handleFinish}
              disabled={busy}
              className="rounded-lg px-5 py-2 text-sm font-bold tracking-wide uppercase disabled:opacity-50"
              style={{ background: NEURAL_CYAN, color: NEURAL_BG }}
            >
              {busy ? "Guardando…" : "Entrar a la app"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
