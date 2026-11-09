import { AlertTriangle, RotateCcw } from "lucide-react";

/** Aviso cuando una página no pudo traer sus datos, con botón para reintentar. */
export function LoadError({ message = "No pudimos cargar la información.", onRetry, className = "" }) {
  return (
    <div className={`mx-auto flex max-w-md flex-col items-center rounded-2xl border border-ink-100 bg-white px-6 py-10 text-center ${className}`}>
      <AlertTriangle className="h-8 w-8 text-brand-600" />
      <p className="mt-3 font-semibold text-ink-900">{message}</p>
      <p className="mt-1 text-sm text-ink-500">Revisá tu conexión a internet y probá de nuevo.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <RotateCcw className="h-4 w-4" /> Reintentar
        </button>
      )}
    </div>
  );
}
