// Aviso corto (toast) para reemplazar `alert()` bloqueante y errores
// silenciosos, en particular cuando una mutación optimista de /tracker falla
// y hay que informar al usuario que la celda se revirtió. Emisor simple sin
// dependencias: ToastHost.tsx se suscribe y renderiza.
//
// `kind` distingue la frase motivacional (TrackerMatrix.tsx, al marcar un
// hábito DONE) del resto de los avisos (errores, "día completo"): antes
// compartía el mismo toast chico de 4s pensado para "ok, guardado" — una
// frase necesita más tiempo en pantalla y pesa distinto, así que tiene su
// propio tratamiento visual en ToastHost.tsx.
export type ToastKind = "default" | "quote";

type Listener = (message: string, kind: ToastKind) => void;

const listeners = new Set<Listener>();

export function showToast(message: string, kind: ToastKind = "default"): void {
  for (const listener of listeners) listener(message, kind);
}

export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
