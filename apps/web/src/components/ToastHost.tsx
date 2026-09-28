import { useEffect, useState } from "react";
import { subscribeToast } from "../lib/toast";

type ToastItem = { id: string; message: string };

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToast((message) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="rounded-md bg-black/90 px-4 py-2 text-center text-sm text-white shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
