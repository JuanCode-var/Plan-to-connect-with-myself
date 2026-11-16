import { useSetCompassMessagesEnabled, type Identity } from "../api/compass";
import { NEURAL_CARD_BG, NEURAL_CARD_BORDER, NEURAL_CYAN, NEURAL_LAVENDER, NEURAL_TEXT, NEURAL_TEXT_SECONDARY } from "./NeuralCore/tokens";

/**
 * Interruptor general de las intervenciones de identidad (etapa 3) — "el
 * usuario puede desactivar estos mensajes [...] en general" (pedido
 * explícito). El apagado por hábito puntual vive en el editor de cada
 * hábito (HabitForm.tsx/HabitRow.tsx), no acá. El ejemplo de abajo usa el
 * ideal REAL si existe — pero sin inventar un hábito pendiente concreto
 * como hace el mockup (eso dependería de saber cuál está atrasado justo
 * ahora, que acá no se calcula).
 */
export function CompassMessagesToggle({ messagesEnabled, identity }: { messagesEnabled: boolean; identity: Identity | undefined }) {
  const setEnabled = useSetCompassMessagesEnabled();

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl p-5" style={{ background: NEURAL_CARD_BG, border: `1px solid ${NEURAL_CARD_BORDER}` }}>
      <div className="flex items-center justify-between gap-4">
        <p className="m-0 text-base font-bold" style={{ color: NEURAL_TEXT }}>
          Mensajes de identidad
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={messagesEnabled}
          onClick={() => setEnabled.mutate(!messagesEnabled)}
          disabled={setEnabled.isPending}
          className="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150"
          style={{ background: messagesEnabled ? NEURAL_CYAN : NEURAL_CARD_BORDER }}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-150"
            style={{ transform: messagesEnabled ? "translateX(22px)" : "translateX(2px)" }}
          />
        </button>
      </div>
      <p className="m-0 text-sm" style={{ color: NEURAL_TEXT_SECONDARY }}>
        Cuando marcas, pospones o te atrasas con un hábito, la app te habla con tu ideal:
      </p>
      {identity ? (
        <p className="m-0 font-reading text-base italic" style={{ color: NEURAL_LAVENDER }}>
          “{identity.statement}. ¿Lo haría esa persona?”
        </p>
      ) : (
        <p className="m-0 text-sm italic" style={{ color: NEURAL_TEXT_SECONDARY }}>
          Escribe tu ideal arriba para ver cómo sonaría acá.
        </p>
      )}
    </div>
  );
}
