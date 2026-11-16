// Aviso corto (toast) para reemplazar `alert()` bloqueante y errores
// silenciosos, en particular cuando una mutación optimista de /tracker falla
// y hay que informar al usuario que la celda se revirtió. Emisor simple sin
// dependencias: ToastHost.tsx se suscribe y renderiza.
//
// `kind` distingue 3 tipos de aviso, cada uno con su propio tratamiento
// visual en ToastHost.tsx: "default" (errores, "día completo" — chico, 4s),
// "quote" (frase al azar de la Biblioteca al cumplir un hábito — itálica,
// 8s) y "identity" (mensajes de Mi Identidad — etapa 3, con tu propia
// frase/contramensaje). "quote" e "identity" pueden aparecer juntos en el
// mismo clic (ver TrackerMatrix.tsx) y antes se veían idénticos, sin forma
// de distinguir cuál era cuál — por eso "identity" tiene su propio look
// (kicker + sin itálica), no reutiliza el de "quote".
export type ToastKind = "default" | "quote" | "identity";

type Listener = (message: string, kind: ToastKind) => void;

const listeners = new Set<Listener>();

export function showToast(message: string, kind: ToastKind = "default"): void {
  for (const listener of listeners) listener(message, kind);
}

export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
