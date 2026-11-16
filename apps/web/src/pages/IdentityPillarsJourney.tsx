import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCompass,
  usePillarsState,
  useSaveCompassProfile,
  useSaveWeaknesses,
  useSavePillarsProgress,
  useSealPillar,
  useCreatePurposeAction,
  type WeaknessInput,
} from "../api/compass";
import { useWordWeight } from "../api/word";
import { NEURAL_BG, NEURAL_TEXT_SECONDARY } from "../components/NeuralCore/tokens";
import { JourneyHeader } from "../components/PillarsJourney/JourneyHeader";
import { JourneyCard } from "../components/PillarsJourney/JourneyCard";
import { UmbralScreen } from "../components/PillarsJourney/UmbralScreen";
import { NucleoIntegradoScreen } from "../components/PillarsJourney/NucleoIntegradoScreen";
import { TextFieldPhase, TogglePhase, EcoBox } from "../components/PillarsJourney/PhaseFields";
import { WeaknessPhase } from "../components/PillarsJourney/WeaknessPhase";
import { ReprogramPhase } from "../components/PillarsJourney/ReprogramPhase";
import { PurposeActionPhase } from "../components/PillarsJourney/PurposeActionPhase";
import { PILLARS, SEAL_PHRASE, findEcoMatches, formatList, splitLines } from "../components/PillarsJourney/pillarsJourneyShared";
import type { PillarKey } from "../api/compass";

const NEURAL_PAGE_BG = `radial-gradient(900px 600px at 50% 0%, rgba(124,92,255,0.14), transparent 70%), ${NEURAL_BG}`;

type Screen = "phase" | "umbral" | "integrated";

export function IdentityPillarsJourney() {
  const navigate = useNavigate();
  const { data: compass, isLoading: loadingCompass } = useCompass();
  const { data: pillars, isLoading: loadingPillars } = usePillarsState();
  const { data: wordWeight } = useWordWeight();
  const saveProfile = useSaveCompassProfile();
  const saveWeaknesses = useSaveWeaknesses();
  const saveProgress = useSavePillarsProgress();
  const sealPillar = useSealPillar();
  const createPurposeAction = useCreatePurposeAction();

  const [pillarIndex, setPillarIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState(1);
  const [screen, setScreen] = useState<Screen>("phase");
  const [sealedAnim, setSealedAnim] = useState(false);

  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftWeaknesses, setDraftWeaknesses] = useState<WeaknessInput[]>([]);

  if (loadingCompass || loadingPillars || !compass || !pillars) {
    return <div className="min-h-[70vh]" style={{ background: NEURAL_PAGE_BG, color: NEURAL_TEXT_SECONDARY }} />;
  }

  const resolvedIndex = pillarIndex ?? (() => {
    const firstUnsealed = PILLARS.findIndex((p) => !pillars.sealed[p.key]);
    return firstUnsealed === -1 ? 0 : firstUnsealed;
  })();
  const pillar = PILLARS[resolvedIndex];
  const nextPillar = PILLARS[resolvedIndex + 1] ?? null;
  const monthsWeight = wordWeight?.monthsWeight ?? 0;

  function startEdit(initial: string) {
    setDraftText(initial);
    setEditing(true);
  }

  function startEditWeaknesses() {
    setDraftWeaknesses(compass!.weaknesses.length > 0 ? compass!.weaknesses.map((w) => ({ text: w.text, counterMessage: w.counterMessage ?? "" })) : [{ text: "", counterMessage: "" }]);
    setEditing(true);
  }

  function closeEdit(field: string | null) {
    if (field) {
      if (field === "weaknesses") {
        saveWeaknesses.mutate(draftWeaknesses.map((w) => ({ text: w.text.trim(), counterMessage: w.counterMessage.trim() })).filter((w) => w.text.length > 0));
      } else {
        saveProfile.mutate({ [field]: draftText } as Record<string, string>);
      }
    }
    setEditing(false);
  }

  function toggleEdit() {
    if (editing) {
      closeEdit(currentFieldKey());
    } else {
      if (currentFieldKey() === "weaknesses") startEditWeaknesses();
      else startEdit((compass as unknown as Record<string, string | null>)[currentFieldKey()!] ?? "");
    }
  }

  function currentFieldKey(): string | null {
    if (pillar.key === "autoconocimiento") {
      return ["uniqueness", "enjoyWithoutBeingAsked", "strengths", "weaknesses"][phase - 1];
    }
    if (pillar.key === "valores") {
      return ["coreValues", "limitingBeliefs", "beliefsToReprogram", "empoweringBeliefs"][phase - 1];
    }
    return ["cause", "impact", "howToLiveDays", null][phase - 1];
  }

  function toggleListItem(field: "strengthsUsed" | "valuesLived", item: string) {
    const current = pillars!.today[field];
    const next = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
    saveProgress.mutate({ [field]: next });
  }

  function goNext() {
    if (editing) closeEdit(currentFieldKey());
    if (phase < 4) {
      setPhase(phase + 1);
      return;
    }
    setScreen("umbral");
  }

  function goBack() {
    if (editing) {
      setEditing(false);
      return;
    }
    if (phase > 1) setPhase(phase - 1);
  }

  function handleCross() {
    sealPillar.mutate(pillar.key, {
      onSuccess: () => setSealedAnim(true),
    });
  }

  function handleAdvanceAfterSeal() {
    setSealedAnim(false);
    if (!nextPillar) {
      setScreen("integrated");
      return;
    }
    setPillarIndex(resolvedIndex + 1);
    setPhase(1);
    setScreen("phase");
  }

  function handleAdjust() {
    setScreen("phase");
    setPhase(4);
  }

  function handleRestart() {
    setPillarIndex(0);
    setPhase(1);
    setScreen("phase");
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8 sm:py-10" style={{ background: NEURAL_PAGE_BG }}>
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <JourneyHeader sealed={pillars.sealed} activePillar={screen === "integrated" ? null : pillar.key} />

        {screen === "phase" && (
          <JourneyCard
            pillar={pillar}
            phase={phase}
            onBack={goBack}
            onNext={goNext}
            nextLabel={phase < 4 ? "Siguiente →" : "Ir al umbral →"}
            editing={editing}
            onToggleEdit={currentFieldKey() ? toggleEdit : undefined}
            pendingPillars={PILLARS.slice(resolvedIndex + 1)}
          >
            <PhaseBody
              pillar={pillar.key}
              phase={phase}
              compass={compass}
              today={pillars.today}
              monthsWeight={monthsWeight}
              editing={editing}
              draftText={draftText}
              onDraftTextChange={setDraftText}
              draftWeaknesses={draftWeaknesses}
              onDraftWeaknessesChange={setDraftWeaknesses}
              onStartEdit={toggleEdit}
              onToggleStrength={(item) => toggleListItem("strengthsUsed", item)}
              onToggleValue={(item) => toggleListItem("valuesLived", item)}
              onReprogramComplete={() => saveProgress.mutate({ beliefsReprogrammed: true })}
              onSelectPurposeAction={(text) => createPurposeAction.mutate(text)}
            />
          </JourneyCard>
        )}

        {screen === "umbral" && (
          <UmbralScreen
            from={pillar}
            to={nextPillar}
            sealed={sealedAnim}
            sealPhrase={SEAL_PHRASE[pillar.key]}
            onCross={handleCross}
            onAdjust={handleAdjust}
            onAdvance={handleAdvanceAfterSeal}
          />
        )}

        {screen === "integrated" && (
          <NucleoIntegradoScreen
            strengthsUsed={pillars.today.strengthsUsed.length}
            strengthsTotal={splitLines(compass.strengths).length}
            valuesLived={pillars.today.valuesLived.length}
            valuesTotal={splitLines(compass.coreValues).length}
            hasPurposeAction={!!pillars.today.purposeAction}
            nextReviewSuggestedAt={pillars.nextReviewSuggestedAt}
            onRestart={() => {
              handleRestart();
              navigate("/identidad/nucleo", { replace: true });
            }}
          />
        )}
      </div>
    </div>
  );
}

function PhaseBody({
  pillar,
  phase,
  compass,
  today,
  monthsWeight,
  editing,
  draftText,
  onDraftTextChange,
  draftWeaknesses,
  onDraftWeaknessesChange,
  onStartEdit,
  onToggleStrength,
  onToggleValue,
  onReprogramComplete,
  onSelectPurposeAction,
}: {
  pillar: PillarKey;
  phase: number;
  compass: NonNullable<ReturnType<typeof useCompass>["data"]>;
  today: NonNullable<ReturnType<typeof usePillarsState>["data"]>["today"];
  monthsWeight: number;
  editing: boolean;
  draftText: string;
  onDraftTextChange: (v: string) => void;
  draftWeaknesses: WeaknessInput[];
  onDraftWeaknessesChange: (v: WeaknessInput[]) => void;
  onStartEdit: () => void;
  onToggleStrength: (item: string) => void;
  onToggleValue: (item: string) => void;
  onReprogramComplete: () => void;
  onSelectPurposeAction: (text: string) => void;
}) {
  if (pillar === "autoconocimiento") {
    if (phase === 1) {
      const strengths = splitLines(compass.strengths);
      const ecoMatches = findEcoMatches(compass.uniqueness, strengths);
      return (
        <div className="flex flex-col gap-4">
          <TextFieldPhase label="Lo que me hace único" question="¿Quién soy cuando nadie me lo pide?" value={editing ? draftText : compass.uniqueness ?? ""} editing={editing} onChange={onDraftTextChange} onStartEdit={onStartEdit} />
          {!editing && ecoMatches.length > 0 && (
            <EcoBox text={`${ecoMatches.length} de estas palabras también son tus fortalezas: ${formatList(ecoMatches)}. Lo que eres y lo que practicas coinciden.`} />
          )}
        </div>
      );
    }
    if (phase === 2) {
      return <TextFieldPhase label="Lo que disfruto sin que me lo pidan" question="¿Qué harías aunque no te lo pidieran?" value={editing ? draftText : compass.enjoyWithoutBeingAsked ?? ""} editing={editing} onChange={onDraftTextChange} onStartEdit={onStartEdit} />;
    }
    if (phase === 3) {
      const strengths = splitLines(compass.strengths);
      return (
        <TogglePhase
          label="Mis fortalezas"
          question="¿Cuál de tus fortalezas usaste hoy?"
          items={strengths}
          selected={today.strengthsUsed}
          onToggle={onToggleStrength}
          caption={`Hoy usaste ${today.strengthsUsed.length} de ${strengths.length}. Cada fortaleza que usas es una acción de quien quieres ser.`}
          editing={editing}
          rawValue={draftText}
          onRawChange={onDraftTextChange}
          onStartEdit={onStartEdit}
        />
      );
    }
    return (
      <WeaknessPhase
        weaknesses={compass.weaknesses}
        monthsWeight={monthsWeight}
        editing={editing}
        draft={draftWeaknesses}
        onDraftChange={onDraftWeaknessesChange}
        onStartEdit={onStartEdit}
      />
    );
  }

  if (pillar === "valores") {
    if (phase === 1) {
      const values = splitLines(compass.coreValues);
      return (
        <TogglePhase
          label="Mis valores"
          question="¿Cuáles viviste hoy, aunque fuera en algo pequeño?"
          items={values}
          selected={today.valuesLived}
          onToggle={onToggleValue}
          caption={`Hoy viviste ${today.valuesLived.length} de ${values.length} valores. Se suman a tus acciones por tu identidad.`}
          editing={editing}
          rawValue={draftText}
          onRawChange={onDraftTextChange}
          onStartEdit={onStartEdit}
        />
      );
    }
    if (phase === 2) {
      return <TextFieldPhase label="Creencias que me limitan" question="¿Qué te dices que te frena?" value={editing ? draftText : compass.limitingBeliefs ?? ""} editing={editing} onChange={onDraftTextChange} onStartEdit={onStartEdit} />;
    }
    if (phase === 3) {
      return <TextFieldPhase label="Creencias que elijo reprogramar" question="¿Cuál de esas vas a dejar de repetirte?" value={editing ? draftText : compass.beliefsToReprogram ?? ""} editing={editing} onChange={onDraftTextChange} onStartEdit={onStartEdit} />;
    }
    return (
      <ReprogramPhase
        limitingBeliefs={compass.limitingBeliefs ?? ""}
        empoweringBeliefs={editing ? draftText : compass.empoweringBeliefs ?? ""}
        reprogrammedToday={today.beliefsReprogrammed}
        onComplete={onReprogramComplete}
        editing={editing}
        draft={draftText}
        onDraftChange={onDraftTextChange}
        onStartEdit={onStartEdit}
      />
    );
  }

  if (phase === 1) {
    return <TextFieldPhase label="¿Qué causa me mueve?" question="¿Qué problema del mundo te duele de verdad?" value={editing ? draftText : compass.cause ?? ""} editing={editing} onChange={onDraftTextChange} onStartEdit={onStartEdit} />;
  }
  if (phase === 2) {
    return <TextFieldPhase label="¿Qué impacto quiero generar?" question="¿Qué quieres dejar en quienes te rodean?" value={editing ? draftText : compass.impact ?? ""} editing={editing} onChange={onDraftTextChange} onStartEdit={onStartEdit} />;
  }
  if (phase === 3) {
    return <TextFieldPhase label="¿Cómo quiero vivir mis días?" question="Si tu propósito fuera un hábito, ¿cómo se vería hoy?" value={editing ? draftText : compass.howToLiveDays ?? ""} editing={editing} onChange={onDraftTextChange} onStartEdit={onStartEdit} />;
  }
  return <PurposeActionPhase selectedText={today.purposeAction?.text ?? null} onSelect={onSelectPurposeAction} />;
}
