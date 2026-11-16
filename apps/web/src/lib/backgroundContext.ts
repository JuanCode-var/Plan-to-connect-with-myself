import { createContext } from "react";

export type BackgroundScene = "neural" | "stars" | "space" | "snow";

export const BACKGROUND_STORAGE_KEY = "dr-axon-background";

export function readStoredBackground(): BackgroundScene {
  try {
    const stored = localStorage.getItem(BACKGROUND_STORAGE_KEY);
    if (stored === "neural" || stored === "stars" || stored === "space" || stored === "snow") return stored;
  } catch {
    // localStorage puede no estar disponible (modo privado, cuotas, etc.);
    // se recae en el fondo neuronal por defecto sin romper la app.
  }
  return "neural";
}

export type BackgroundContextValue = {
  scene: BackgroundScene;
  setScene: (scene: BackgroundScene) => void;
};

export const BackgroundContext = createContext<BackgroundContextValue | undefined>(undefined);
