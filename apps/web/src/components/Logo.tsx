/** Marca de la app: el cerebro-foco de neón (imagen propia, ver
 * apps/web/public/logo-brain.png) dentro de una placa redondeada — la
 * imagen trae su propio fondo negro sólido, por eso va en una placa fija
 * (no transparente) en vez de intentar que se mezcle con el fondo del tema
 * claro/oscuro. Reutilizada por AppShell, Login y Register para que la
 * identidad visual sea la misma dentro y fuera del login. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: "#0a0a0f" }}>
        <img src="/logo-brain.png" alt="" width={28} height={28} className="h-full w-full object-cover" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold" style={{ color: "var(--text)" }}>
          Evolving Mind
        </span>
      )}
    </div>
  );
}
