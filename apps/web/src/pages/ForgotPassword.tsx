import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "../api/auth";
import { useBackgroundScene } from "../lib/useBackgroundScene";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { Logo } from "../components/Logo";

/**
 * El mensaje de éxito es siempre el mismo genérico que devuelve el server
 * (ver apps/api/src/routes/auth.ts) — nunca confirma si el email tiene
 * cuenta o no, a propósito.
 */
export function ForgotPassword() {
  const { scene } = useBackgroundScene();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    forgotPasswordMutation.mutate({ email: email.trim() });
  }

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center px-4 py-10" style={{ background: "var(--bg)" }}>
      <AnimatedBackground scene={scene} />
      <div
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-2xl border p-6"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: "var(--text)" }}>
              Recuperar contraseña
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
              Ingresá el email de tu cuenta y te mandamos un enlace para elegir una nueva contraseña.
            </p>
          </div>
        </div>

        {forgotPasswordMutation.isSuccess ? (
          <p className="text-center text-sm" style={{ color: "var(--text)" }}>
            {forgotPasswordMutation.data.message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                className="rounded-lg border p-2"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="rounded-lg px-3 py-2 text-sm font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              {forgotPasswordMutation.isPending ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        )}

        <p className="text-center text-sm" style={{ color: "var(--text-2)" }}>
          <Link to="/login" style={{ color: "var(--accent)" }}>
            ← Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
