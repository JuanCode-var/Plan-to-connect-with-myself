import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { useResetPasswordMutation } from "../api/auth";
import { useAuth } from "../lib/useAuth";
import { useBackgroundScene } from "../lib/useBackgroundScene";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { Logo } from "../components/Logo";

/** Llega acá desde el enlace del email ("/reset-password?token=..."), ver apps/api/src/lib/email.ts. */
export function ResetPassword() {
  const { scene } = useBackgroundScene();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const resetPasswordMutation = useResetPasswordMutation();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatchError, setMismatchError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMismatchError(true);
      return;
    }
    setMismatchError(false);
    if (!token) return;

    resetPasswordMutation.mutate(
      { token, newPassword },
      {
        onSuccess: (res) => {
          signIn(res.token, res.user);
          navigate("/tracker", { replace: true });
        },
      },
    );
  }

  const isExpiredOrInvalid = resetPasswordMutation.isError && resetPasswordMutation.error instanceof ApiError;

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center px-4 py-10" style={{ background: "var(--bg)" }}>
      <AnimatedBackground scene={scene} />
      <div
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-2xl border p-6"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
          <h1 className="font-display text-xl font-bold" style={{ color: "var(--text)" }}>
            Elige tu nueva contraseña
          </h1>
        </div>

        {!token ? (
          <p className="text-center text-sm" style={{ color: "var(--text)" }}>
            Este enlace no es válido.{" "}
            <Link to="/forgot-password" style={{ color: "var(--accent)" }}>
              Pedí uno nuevo
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
              Nueva contraseña
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="rounded-lg border p-2"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <span className="text-xs" style={{ color: "var(--text-2)" }}>
                Mínimo 6 caracteres.
              </span>
            </label>

            <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
              Confirmar contraseña
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="rounded-lg border p-2"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>

            {mismatchError && <p className="text-sm text-red-500">Las contraseñas no coinciden.</p>}
            {isExpiredOrInvalid && (
              <p className="text-sm text-red-500">
                El enlace no es válido o ya venció.{" "}
                <Link to="/forgot-password" style={{ color: "var(--accent)" }}>
                  Pedí uno nuevo
                </Link>
                .
              </p>
            )}

            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="rounded-lg px-3 py-2 text-sm font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              {resetPasswordMutation.isPending ? "Guardando…" : "Guardar nueva contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
