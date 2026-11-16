import { useState } from "react";
import type { WordCommitmentUnlocked } from "../api/word";
import { AREA_OF_CATEGORY, BRAIN_AREA_COLOR, BRAIN_AREA_LABEL } from "./NeuralCore/brainTokens";
import { NEURAL_CYAN, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";
import { SignaturePad } from "./SignaturePad";
import { firstName } from "../lib/greeting";
import { useAuth } from "../lib/useAuth";

function formatFullDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

/** "Ver documento" (mockup 12b, link al pie de cada tarjeta) — el texto completo, sin recortar, + editar/eliminar + la firma compartida del vault. */
export function WordCommitmentDetailModal({
  commitment,
  signatureDataUrl,
  signedAt,
  signing,
  onSign,
  onEdit,
  onDelete,
  onClose,
}: {
  commitment: WordCommitmentUnlocked;
  signatureDataUrl: string | null;
  signedAt: string | null;
  signing: boolean;
  onSign: (dataUrl: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [draftSignature, setDraftSignature] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const brainArea = commitment.area ? AREA_OF_CATEGORY[commitment.area] : null;
  const color = brainArea ? BRAIN_AREA_COLOR[brainArea] : "#64748B";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 overflow-y-auto p-4 pt-10 sm:p-8 sm:pt-16" style={{ background: "rgba(5,5,9,0.78)" }} onClick={onClose}>
        <article
          onClick={(e) => e.stopPropagation()}
          className="mx-auto mb-10 flex max-w-xl flex-col gap-5 rounded-[20px] p-7 sm:p-9"
          style={{ background: "#0B0F28", border: `1px solid ${color}55`, borderTop: `4px solid ${color}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="m-0 text-xl font-extrabold" style={{ color: NEURAL_TEXT }}>
                {commitment.title}
              </h2>
              {brainArea && (
                <span className="self-start rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `${color}22`, color }}>
                  {BRAIN_AREA_LABEL[brainArea]}
                </span>
              )}
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="shrink-0 text-sm font-semibold" style={{ color: NEURAL_TEXT_SECONDARY }}>
              ✕
            </button>
          </div>

          <p className="m-0 whitespace-pre-wrap" style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 16, lineHeight: 1.6, color: NEURAL_TEXT }}>
            {commitment.text}
          </p>

          <p className="m-0 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
            Desde el {formatFullDate(commitment.startDate)} hasta el {formatFullDate(commitment.targetDate)}.
          </p>

          <div className="flex items-center gap-4 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <button type="button" onClick={onEdit} className="text-xs font-semibold underline underline-offset-2" style={{ color: NEURAL_LAVENDER }}>
              Editar
            </button>
            {confirmingDelete ? (
              <span className="flex items-center gap-2 text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
                ¿Seguro?
                <button type="button" onClick={onDelete} className="font-bold" style={{ color: "#F87171" }}>
                  Sí, eliminar
                </button>
                <button type="button" onClick={() => setConfirmingDelete(false)} style={{ color: NEURAL_TEXT_SECONDARY }}>
                  Cancelar
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmingDelete(true)} className="text-xs font-semibold underline underline-offset-2" style={{ color: "#F87171" }}>
                Eliminar
              </button>
            )}
          </div>

          <div className="border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {signatureDataUrl ? (
              <div className="flex items-center gap-3">
                <div className="rounded-xl border-2 p-2" style={{ borderColor: "#c9bfa0", background: "#faf6ec" }}>
                  <img src={signatureDataUrl} alt="Tu firma" className="h-16 w-auto" />
                </div>
                <div className="flex flex-col">
                  <span style={{ fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", color: NEURAL_LAVENDER }}>
                    {user ? firstName(user.name) : ""}
                  </span>
                  {signedAt && <span style={{ fontSize: 11, color: NEURAL_TEXT_SECONDARY }}>Firmado el {formatFullDate(signedAt)}</span>}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <span className="text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
                  Todavía no firmaste tus compromisos.
                </span>
                <SignaturePad onChange={setDraftSignature} height={140} />
                <button
                  type="button"
                  disabled={!draftSignature || signing}
                  onClick={() => onSign(draftSignature)}
                  className="rounded-xl px-5 py-2 text-sm font-bold disabled:opacity-50"
                  style={{ background: NEURAL_CYAN, color: "#070B1F" }}
                >
                  {signing ? "Guardando…" : "Firmar"}
                </button>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
