import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  BackgroundContext,
  BACKGROUND_STORAGE_KEY,
  readStoredBackground,
  type BackgroundScene,
} from "./backgroundContext";

/**
 * Fuente de verdad de la escena de fondo animado (estrellas / espacio /
 * nieve) que se ve detrás de las 4 vistas principales, ver
 * AnimatedBackground.tsx. Igual que ThemeProvider: contexto + localStorage,
 * así el selector en ProfileMenu y el canvas en AppShell siempre ven el
 * mismo valor.
 */
export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [scene, setSceneState] = useState<BackgroundScene>(() => readStoredBackground());

  const setScene = useCallback((next: BackgroundScene) => {
    setSceneState(next);
    try {
      localStorage.setItem(BACKGROUND_STORAGE_KEY, next);
    } catch {
      // ver nota en readStoredBackground
    }
  }, []);

  const value = useMemo(() => ({ scene, setScene }), [scene, setScene]);

  return <BackgroundContext.Provider value={value}>{children}</BackgroundContext.Provider>;
}
