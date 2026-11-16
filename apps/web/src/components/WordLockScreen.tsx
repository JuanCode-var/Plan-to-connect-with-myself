import { useEffect, useRef, useState } from "react";
import { useSetWordPin, useUnlockWord, type WordVaultContent } from "../api/word";
import { WordPinInput, type WordPinInputHandle } from "./WordPinInput";
import { ApiError } from "../api/client";
import { NEURAL_CYAN, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

const PIN_LENGTH = 4;

/** Escudo con check, en vez del sello anterior — mockup 12. */
function ShieldIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={NEURAL_LAVENDER} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3.5l6.5 2.4v5.2c0 4.1-2.7 7.3-6.5 8.4-3.8-1.1-6.5-4.3-6.5-8.4V5.9L12 3.5z" />
      <path d="M9 12.2l2 2 4-4.2" />
    </svg>
  );
}

/**
 * Pantalla de candado de "Mi Palabra": lo primero que se ve al entrar a la
 * sección, SIEMPRE — no hay forma de saltearla ni de que quede desbloqueada
 * de una visita a otra (ver comentario en api/word.ts). Dos modos según
 * `meta.hasPin`: la primera vez, configurar el PIN (dos pasadas: elegir +
 * repetir); después, ingresarlo. Teclado propio (WordPinInput) sin botón
 * "Entrar": al completar los 4 dígitos se dispara solo (mockup 12).
 */
export function WordLockScreen({
  hasPin,
  onUnlocked,
}: {
  hasPin: boolean;
  onUnlocked: (pin: string, content: WordVaultContent) => void;
}) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [stage, setStage] = useState<"pin" | "confirm">("pin");
  const [error, setError] = useState<string | undefined>();
  const pinRef = useRef<WordPinInputHandle>(null);

  const setPinMutation = useSetWordPin();
  const unlockMutation = useUnlockWord();
  const busy = setPinMutation.isPending || unlockMutation.isPending;

  const activeValue = !hasPin && stage === "confirm" ? confirmPin : pin;

  function setActiveValue(v: string) {
    if (!hasPin && stage === "confirm") setConfirmPin(v);
    else setPin(v);
  }

  useEffect(() => {
    if (busy || activeValue.length < PIN_LENGTH) return;

    if (hasPin) {
      setError(undefined);
      unlockMutation.mutate(pin, {
        onSuccess: (content) => onUnlocked(pin, content),
        onError: (e) => {
          setError(e instanceof ApiError && e.status === 401 ? "PIN incorrecto" : "No se pudo verificar el PIN");
          setPin("");
          pinRef.current?.shake();
        },
      });
      return;
    }

    if (stage === "pin") {
      setStage("confirm");
      return;
    }

    if (pin !== confirmPin) {
      setError("Los dos PIN no coinciden");
      setConfirmPin("");
      pinRef.current?.shake();
      return;
    }
    setError(undefined);
    setPinMutation.mutate(
      { newPin: pin },
      {
        onSuccess: () => unlockMutation.mutate(pin, { onSuccess: (content) => onUnlocked(pin, content) }),
        onError: () => {
          setError("No se pudo guardar el PIN, intenta de nuevo");
          setStage("pin");
          setPin("");
          setConfirmPin("");
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeValue, hasPin, stage, busy]);

  const subtitle = hasPin
    ? "Lo que prometiste por escrito está aquí dentro."
    : stage === "pin"
      ? "Vas a dejar tu palabra por escrito. Protegela con un PIN."
      : "Repetilo para confirmar.";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-7 px-6 text-center">
      <div
        className="word-lock-breathe flex h-20 w-20 items-center justify-center rounded-full"
        style={{ border: `1.5px solid ${NEURAL_CYAN}` }}
      >
        <ShieldIcon />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-wide sm:text-4xl" style={{ color: NEURAL_TEXT }}>
          Mi palabra
        </h1>
        <p className="font-ceremony text-lg italic" style={{ color: NEURAL_LAVENDER }}>
          {subtitle}
        </p>
      </div>

      <WordPinInput ref={pinRef} value={activeValue} onChange={setActiveValue} disabled={busy} />

      {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

      <p className="max-w-xs text-xs" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Tu palabra es privada. Solo tú la ves.
      </p>
    </div>
  );
}
