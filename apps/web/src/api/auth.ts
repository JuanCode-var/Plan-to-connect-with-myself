import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "./client";

export type AuthUser = { id: string; name: string; email: string };
export type AuthResponse = { token: string; user: AuthUser };

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string }) =>
      apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

/** GET /api/auth/me — llamada directa (no useQuery) porque solo se usa una
 * vez, al arrancar la app, para validar el token guardado (ver
 * lib/auth.tsx::AuthProvider). */
export function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me");
}
