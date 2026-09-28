import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, type Location } from "react-router-dom";
import { useLoginMutation } from "../api/auth";
import { useAuth } from "../lib/useAuth";
import { Logo } from "../components/Logo";

export function Login() {
  const { user, isLoading, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Ya logueado (ej. volviste a /login con la sesión todavía válida): no
  // tiene sentido mostrar el formulario de nuevo.
  if (!isLoading && user) {
    return <Navigate to="/tracker" replace />;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (res) => {
          signIn(res.token, res.user);
          const state = location.state as { from?: Location } | null;
          navigate(state?.from?.pathname ?? "/tracker", { replace: true });
        },
      },
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ background: "var(--bg)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border p-6"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo compact />
          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: "var(--text)" }}>
              Bienvenido de nuevo
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
              Iniciá sesión para seguir con tu ciclo.
            </p>
          </div>
        </div>

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

        <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            required
            className="rounded-lg border p-2"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {loginMutation.isError && (
          <p className="text-sm text-red-500">Email o contraseña incorrectos.</p>
        )}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="rounded-lg px-3 py-2 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          {loginMutation.isPending ? "Ingresando…" : "Ingresar"}
        </button>

        <p className="text-center text-sm" style={{ color: "var(--text-2)" }}>
          ¿Todavía no tenés cuenta?{" "}
          <Link to="/register" style={{ color: "var(--accent)" }}>
            Registrate
          </Link>
        </p>
      </form>
    </div>
  );
}
