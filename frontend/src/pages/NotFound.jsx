import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Seo } from "../components/Seo";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <Seo title="Página no encontrada" noIndex />
      <p className="font-display text-6xl font-bold text-brand-600">404</p>
      <h1 className="mt-3 text-xl font-bold text-ink-900">Esta página no existe</h1>
      <p className="mt-2 text-sm text-ink-500">Puede que el link esté roto o la página se haya movido.</p>
      <Link to="/" className="mt-6">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  );
}
