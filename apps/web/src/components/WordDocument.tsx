import { useState } from "react";
import {
  useSaveWordCommitments,
  useSaveWordSignature,
  useSealMonth,
  useReportFall,
  useUnlockWord,
  type WordCommitmentInput,
  type WordCommitmentUnlocked,
} from "../api/word";
import { useCompass } from "../api/compass";
import { findPendingClosures, findUpcomingClosures, addMonthsISO } from "../lib/wordMonths";
import { todayISO } from "../lib/date";
import { SectionIntro } from "./SectionIntro";
import { WordWeightCard } from "./WordWeightCard";
import { WordMonthClosureCard, type SealFeedback } from "./WordMonthClosureCard";
import { WordCommitmentCard } from "./WordCommitmentCard";
import { WordCommitmentForm } from "./WordCommitmentForm";
import { WordDurationPicker } from "./WordDurationPicker";
import { WordCommitmentDetailModal } from "./WordCommitmentDetailModal";
import { showToast } from "../lib/toast";
import { NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_CYAN_BORDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

function toCommitmentInput(c: WordCommitmentUnlocked): WordCommitmentInput {
  return {
    id: c.id,
    title: c.title,
    text: c.text,
    startDate: c.startDate.slice(0, 10),
    targetDate: c.targetDate.slice(0, 10),
    area: c.area,
  };
}

/**
 * El documento en sí, visible solo después de pasar WordLockScreen (mockups
 * 12b-12e). El PIN se recibe de ahí y se re-envía en cada guardado (editar
 * compromisos, cerrar un mes, reportar una caída, firmar) — la API lo
 * vuelve a validar cada vez (ver routes/word.ts), nunca se confía en que
 * "ya estaba desbloqueado" del lado del cliente. Después de CUALQUIER
 * cambio se vuelve a pedir /unlock completo (`refresh`) en vez de intentar
 * mezclar la respuesta parcial a mano — los tramos de mes (ver
 * buildMonthsInfo en la API) dependen de startDate/targetDate, así que la
 * única fuente de verdad después de editar fechas es el servidor.
 */
export function WordDocument({
  pin,
  commitments,
  signatureDataUrl,
  signedAt,
  monthsWeight,
  onLock,
}: {
  pin: string;
  commitments: WordCommitmentUnlocked[];
  signatureDataUrl: string | null;
  signedAt: string | null;
  monthsWeight: number;
  onLock: () => void;
}) {
  const [localCommitments, setLocalCommitments] = useState(commitments);
  const [localSignature, setLocalSignature] = useState(signatureDataUrl);
  const [localSignedAt, setLocalSignedAt] = useState(signedAt);
  const [localWeight, setLocalWeight] = useState(monthsWeight);

  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [draftInitial, setDraftInitial] = useState<WordCommitmentInput | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [sealFeedback, setSealFeedback] = useState<SealFeedback | null>(null);
  const [reportingFallId, setReportingFallId] = useState<string | null>(null);

  const { data: compass } = useCompass();
  const weaknessText = compass?.weaknesses[0]?.text ?? null;

  const saveCommitments = useSaveWordCommitments();
  const saveSignature = useSaveWordSignature();
  const sealMonth = useSealMonth();
  const reportFall = useReportFall();
  const unlockWord = useUnlockWord();

  async function refresh() {
    try {
      const content = await unlockWord.mutateAsync(pin);
      setLocalCommitments(content.commitments);
      setLocalSignature(content.signatureDataUrl);
      setLocalSignedAt(content.signedAt);
      setLocalWeight(content.monthsWeight);
    } catch {
      showToast("No se pudo actualizar. Revisa tu conexión e intenta de nuevo.");
    }
  }

  function persist(items: WordCommitmentInput[]) {
    saveCommitments.mutate(
      { pin, items },
      {
        onSuccess: async () => {
          setShowDurationPicker(false);
          setDraftInitial(null);
          setEditingId(null);
          setViewingId(null);
          await refresh();
        },
        onError: () => showToast("No se pudo guardar. Revisa tu conexión e intenta de nuevo."),
      },
    );
  }

  function handleCreate(input: WordCommitmentInput) {
    persist([...localCommitments.map(toCommitmentInput), input]);
  }

  function handleEditSave(input: WordCommitmentInput) {
    persist(localCommitments.map(toCommitmentInput).map((c) => (c.id === input.id ? input : c)));
  }

  function handleDelete(id: string) {
    persist(localCommitments.map(toCommitmentInput).filter((c) => c.id !== id));
  }

  function handleSign(dataUrl: string) {
    saveSignature.mutate(
      { pin, signatureDataUrl: dataUrl },
      {
        onSuccess: (res) => {
          setLocalSignature(res.signatureDataUrl);
          setLocalSignedAt(res.signedAt);
        },
        onError: () => showToast("No se pudo guardar la firma. Intentá de nuevo."),
      },
    );
  }

  function handleAnswerClosure(commitmentId: string, monthIndex: number, sealed: boolean) {
    const title = localCommitments.find((c) => c.id === commitmentId)?.title ?? "";
    sealMonth.mutate(
      { commitmentId, monthIndex, pin, sealed },
      {
        onSuccess: ({ commitment, monthsWeight: newWeight }) => {
          setLocalCommitments((prev) => prev.map((c) => (c.id === commitment.id ? commitment : c)));
          setLocalWeight(newWeight);
          setSealFeedback(sealed ? { type: "sealed", title, monthsWeight: newWeight } : { type: "honest", title });
        },
        onError: () => showToast("No se pudo guardar tu respuesta. Intentá de nuevo."),
      },
    );
  }

  function handleReportFall(commitmentId: string) {
    setReportingFallId(commitmentId);
    reportFall.mutate(
      { commitmentId, pin },
      {
        onSuccess: (updated) => {
          setLocalCommitments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setReportingFallId(null);
        },
        onError: () => {
          showToast("No se pudo reportar la caída. Intentá de nuevo.");
          setReportingFallId(null);
        },
      },
    );
  }

  function handleStartRenew() {
    setSealFeedback(null);
    setShowDurationPicker(true);
  }

  const editing = localCommitments.find((c) => c.id === editingId) ?? null;
  const viewing = localCommitments.find((c) => c.id === viewingId) ?? null;
  const pendingClosures = findPendingClosures(localCommitments);
  const upcomingClosures = findUpcomingClosures(localCommitments);

  return (
    <div className="word-document-in mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold tracking-wide sm:text-4xl" style={{ color: NEURAL_TEXT }}>
            Mi palabra
          </h1>
          <p className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY, maxWidth: 460 }}>
            Tus compromisos firmados contigo mismo. Cada mes que los honras, tu palabra pesa más.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowDurationPicker(true)}
            className="rounded-xl px-4 py-2.5 text-sm font-bold"
            style={{ background: NEURAL_CYAN, color: "#070B1F" }}
          >
            + Nuevo compromiso
          </button>
          <button
            type="button"
            onClick={onLock}
            className="rounded-xl border px-4 py-2.5 text-sm font-bold"
            style={{ borderColor: NEURAL_CYAN_BORDER, color: "#22D3EE" }}
          >
            Bloquear
          </button>
        </div>
      </div>

      <SectionIntro
        id="word"
        purpose="Los compromisos que te das a ti mismo, con PIN propio."
        steps={["Configura tu PIN la primera vez.", "Elige cuántos meses vas a sostenerlo.", "Fírmalo a mano para sellarlo."]}
        benefit="Ganas un documento que pesa distinto a una nota más."
        colors={{
          bg: "rgba(255,255,255,0.04)",
          border: NEURAL_CARD_BORDER,
          text: NEURAL_TEXT,
          textMuted: NEURAL_TEXT_SECONDARY,
          accent: "#22D3EE",
          accentSoft: "rgba(34,211,238,0.12)",
        }}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:[&>*:first-child]:flex-[1.25] lg:[&>*:last-child]:flex-1">
        <WordWeightCard commitments={localCommitments} monthsWeight={localWeight} weaknessText={weaknessText} />
        <WordMonthClosureCard
          pendingClosures={pendingClosures}
          upcomingClosures={upcomingClosures}
          onAnswer={handleAnswerClosure}
          answering={sealMonth.isPending}
          feedback={sealFeedback}
          onStartRenew={handleStartRenew}
        />
      </div>

      {localCommitments.length === 0 ? (
        <p className="font-reading text-base italic" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Todavía no escribiste ningún compromiso. "+ Nuevo compromiso" para dejar tu palabra por escrito.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {localCommitments.map((c) => (
            <WordCommitmentCard
              key={c.id}
              commitment={c}
              signatureDataUrl={localSignature}
              signedAt={localSignedAt}
              onOpenDocument={() => setViewingId(c.id)}
              onReportFall={() => handleReportFall(c.id)}
              reportingFall={reportingFallId === c.id}
            />
          ))}
        </div>
      )}

      {showDurationPicker && (
        <WordDurationPicker
          onCancel={() => setShowDurationPicker(false)}
          onContinue={(months) => {
            const startDate = todayISO();
            setDraftInitial({ title: "", text: "", startDate, targetDate: addMonthsISO(startDate, months), area: null });
            setShowDurationPicker(false);
          }}
        />
      )}

      {draftInitial && (
        <WordCommitmentForm
          initial={draftInitial}
          saving={saveCommitments.isPending}
          onCancel={() => setDraftInitial(null)}
          onSave={handleCreate}
        />
      )}

      {editing && (
        <WordCommitmentForm
          initial={toCommitmentInput(editing)}
          saving={saveCommitments.isPending}
          onCancel={() => setEditingId(null)}
          onSave={handleEditSave}
        />
      )}

      {viewing && !editing && (
        <WordCommitmentDetailModal
          commitment={viewing}
          signatureDataUrl={localSignature}
          signedAt={localSignedAt}
          signing={saveSignature.isPending}
          onSign={handleSign}
          onEdit={() => {
            setEditingId(viewing.id);
            setViewingId(null);
          }}
          onDelete={() => handleDelete(viewing.id)}
          onClose={() => setViewingId(null)}
        />
      )}
    </div>
  );
}
