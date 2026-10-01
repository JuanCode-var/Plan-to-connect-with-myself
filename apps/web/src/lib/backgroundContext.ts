import { createContext } from "react";

export type BackgroundScene = "stars" | "space" | "snow";

export const BACKGROUND_STORAGE_KEY = "dr-axon-background";

export function readStoredBackground(): BackgroundScene {
  try {
    const stored = localStorage.getItem(BACKGROUND_STORAGE_KEY);
    if (stored === "stars" || stored === "space" || stored === "snow") return stored;
  } catch {
    // localStorage puede no estar disponible (modo privado, cuotas, etc.);
    // se recae en el fondo de estrellas por defecto sin romper la app.
  }
  return "stars";
}

export type BackgroundContextValue = {
  scene: BackgroundScene;
  setScene: (scene: BackgroundScene) => void;
};

export const BackgroundContext = createContext<BackgroundContextValue | undefined>(undefined);
