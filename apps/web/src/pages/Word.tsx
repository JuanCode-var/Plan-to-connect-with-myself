import { useState } from "react";
import { useWordMeta, type WordVaultContent } from "../api/word";
import { WordLockScreen } from "../components/WordLockScreen";
import { WordDocument } from "../components/WordDocument";
import { NEURAL_BG } from "../components/NeuralCore/tokens";

/**
 * "Mi Palabra" — la sección más importante de la app (pedido explícito del
 * usuario): el espacio donde deja por escrito los compromisos que se da a
 * sí mismo, protegido por su propio PIN (distinto del login) y firmado a
 * mano. Por diseño, nunca queda "ya desbloqueada": cada visita a esta
 * página vuelve a mostrar el candado — ver api/word.ts para el porqué. El
 * contenido (compromisos/firma) y el PIN tecleado viven solo en el estado
 * de este componente, nunca en una query cacheada ni en localStorage.
 */
/**
 * Identidad "Núcleo Neural" (igual que Biblioteca): fondo propio siempre
 * oscuro, independiente del tema claro/oscuro del resto de la app. Plano,
 * sin degradé de acento propio (pedido explícito: el mismo fondo liso que
 * ya tienen Seguimiento/Resumen, en vez de un brillo de color distinto por
 * sección) — todo el contenido de adentro asume este fondo oscuro fijo
 * (texto blanco, tarjetas translúcidas claras), así que seguiría siendo
 * ilegible si esto pasara a reaccionar al tema claro/oscuro general.
 */
function NeuralPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full px-4 py-8 sm:px-8" style={{ background: NEURAL_BG }}>
      {children}
    </div>
  );
}

export function Word() {
  const { data: meta, isLoading } = useWordMeta();
  const [unlocked, setUnlocked] = useState<{ pin: string; content: WordVaultContent } | undefined>(undefined);

  if (isLoading || !meta) {
    return (
      <NeuralPage>
        <div className="min-h-[70vh]" />
      </NeuralPage>
    );
  }

  if (!unlocked) {
    return (
      <NeuralPage>
        <WordLockScreen
          hasPin={meta.hasPin}
          onUnlocked={(pin, content) => {
            // El PIN recién tecleado se necesita de nuevo para poder editar
            // compromisos o firmar (ver comentario en WordDocument.tsx) — vive
            // solo en este estado de React mientras la sección está
            // desbloqueada, nunca en localStorage ni en una query cacheada.
            setUnlocked({ pin, content });
          }}
        />
      </NeuralPage>
    );
  }

  return (
    <NeuralPage>
      <WordDocument
        pin={unlocked.pin}
        commitments={unlocked.content.commitments}
        signatureDataUrl={unlocked.content.signatureDataUrl}
        signedAt={unlocked.content.signedAt}
        monthsWeight={unlocked.content.monthsWeight}
        onLock={() => setUnlocked(undefined)}
      />
    </NeuralPage>
  );
}
