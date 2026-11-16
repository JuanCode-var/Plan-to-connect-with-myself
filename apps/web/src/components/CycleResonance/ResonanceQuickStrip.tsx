/**
 * Franja compacta debajo del encabezado del ciclo (pedido explícito, sección
 * 1 del pedido de reorganización) — vive en el área de Dashboard.tsx que SÍ
 * respeta el tema claro/oscuro del usuario (a diferencia de ResonanceSection,
 * con fondo fijo), así que usa los tokens de tema (`var(--...)`) en vez de la
 * paleta fija de NeuralCore. Un ítem por dato real; si los dos cuentan 0, no
 * se muestra nada (nunca una franja vacía).
 */
export function ResonanceQuickStrip({
  activeCommitmentsCount,
  caidaChainsCount,
  onOpenRecableado,
  onOpenCadena,
}: {
  activeCommitmentsCount: number;
  caidaChainsCount: number;
  onOpenRecableado: () => void;
  onOpenCadena: () => void;
}) {
  if (activeCommitmentsCount === 0 && caidaChainsCount === 0) return null;

  return (
    <div
      className="flex items-center gap-3 rounded-full px-4 text-sm"
      style={{
        height: 44,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        backdropFilter: "blur(8px)",
        color: "var(--text)",
      }}
    >
      {activeCommitmentsCount > 0 && (
        <button type="button" onClick={onOpenRecableado} className="font-semibold" style={{ color: "var(--accent)" }}>
          {activeCommitmentsCount} {activeCommitmentsCount === 1 ? "compromiso activo" : "compromisos activos"} →
        </button>
      )}
      {activeCommitmentsCount > 0 && caidaChainsCount > 0 && <span style={{ color: "var(--text-2)" }}>·</span>}
      {caidaChainsCount > 0 && (
        <button type="button" onClick={onOpenCadena} className="font-semibold" style={{ color: "var(--accent)" }}>
          {caidaChainsCount} {caidaChainsCount === 1 ? "cadena de caída" : "cadenas de caída"} →
        </button>
      )}
    </div>
  );
}
