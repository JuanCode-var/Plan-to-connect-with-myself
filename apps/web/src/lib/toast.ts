// Aviso corto (toast) para reemplazar `alert()` bloqueante y errores
// silenciosos, en particular cuando una mutación optimista de /tracker falla
// y hay que informar al usuario que la celda se revirtió. Emisor simple sin
// dependencias: ToastHost.tsx se suscribe y renderiza.

type Listener = (message: string) => void;

const listeners = new Set<Listener>();

export function showToast(message: string): void {
  for (const listener of listeners) listener(message);
}

export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
