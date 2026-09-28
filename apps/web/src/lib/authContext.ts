import { createContext } from "react";
import type { AuthUser } from "../api/auth";

export type AuthContextValue = {
  user: AuthUser | null;
  /** true solo durante la validación inicial del token guardado (ver
   * AuthProvider) — evita un parpadeo a /login antes de confirmar sesión. */
  isLoading: boolean;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
