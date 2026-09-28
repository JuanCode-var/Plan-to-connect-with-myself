import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useRegisterMutation } from "../api/auth";
import { useAuth } from "../lib/useAuth";
import { Logo } from "../components/Logo";

export function Register() {
  const { user, isLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isLoading && user) {
    return <Navigate to="/tracker" replace />;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    registerMutation.mutate(
      { name: name.trim(), email: email.trim(), password },
      {
        onSuccess: (res) => {
          signIn(res.token, res.user);
          navigate("/tracker", { replace: true });
        },
      },
    );
  }

  const isDuplicateEmail =
    registerMutation.error instanceof ApiError && registerMutation.error.status === 409;

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
              Creá tu cuenta
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
              Para que la app te salude por tu nombre y siga tu progreso.
            </p>
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-2)" }}>
          Nombre
          <input
            autoComplete="name"
            required
            className="rounded-lg border p-2"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

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
            autoComplete="new-password"
            required
            minLength={6}
            className="rounded-lg border p-2"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="text-xs" style={{ color: "var(--text-2)" }}>
            Mínimo 6 caracteres.
          </span>
        </label>

        {registerMutation.isError && (
          <p className="text-sm text-red-500">
            {isDuplicateEmail
              ? "Ya existe una cuenta con ese email."
              : "No se pudo crear la cuenta. Revisá los datos e intentá de nuevo."}
          </p>
        )}

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="rounded-lg px-3 py-2 text-sm font-semibold"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          {registerMutation.isPending ? "Creando cuenta…" : "Crear cuenta"}
        </button>

        <p className="text-center text-sm" style={{ color: "var(--text-2)" }}>
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" style={{ color: "var(--accent)" }}>
            Iniciá sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
