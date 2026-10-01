import { useContext } from "react";
import { BackgroundContext, type BackgroundContextValue } from "./backgroundContext";

export function useBackgroundScene(): BackgroundContextValue {
  const ctx = useContext(BackgroundContext);
  if (!ctx) {
    throw new Error("useBackgroundScene debe usarse dentro de <BackgroundProvider>");
  }
  return ctx;
}
