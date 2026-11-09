import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { FileInput } from "../../components/ui/FileInput";
import { Spinner } from "../../components/ui/Spinner";
import { confirmAction, confirmDelete, toastSuccess, toastError } from "../../lib/alerts";
import { useSiteConfigStore } from "../../store/siteConfigStore";

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_LOGO_BYTES = 4 * 1024 * 1024;

function checkLogo(file) {
  if (!LOGO_TYPES.includes(file.type)) return "El logo tiene que ser PNG, JPG, WEBP o SVG";
  if (file.size > MAX_LOGO_BYTES) return "El logo pesa más de 4 MB. Probá con una versión más liviana";
  return null;
}

/**
 * Un logo con su vista previa: muestra el actual, deja elegir uno nuevo, lo
 * muestra antes de confirmar y lo sube. `onRemove` (opcional) agrega "Quitar".
 */
function LogoField({ title, help, current, fallbackText, endpoint, previewBg, imgClass = "", onSaved, onRemove }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  function choose(e) {
    const f = e.target.files?.[0] || null;
    if (f) {
      const problem = checkLogo(f);
      if (problem) {
        setFileKey((k) => k + 1);
        return toastError(problem);
      }
    }
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function cancel() {
    setFile(null);
    setPreview(null);
    setFileKey((k) => k + 1);
  }

  async function upload() {
    const confirmed = await confirmAction({
      title: current ? `¿Reemplazar el ${title.toLowerCase()}?` : `¿Guardar el ${title.toLowerCase()}?`,
      text: "El logo nuevo se ve en toda la tienda apenas lo guardes.",
      confirmText: "Sí, guardar",
      icon: "question"
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const { data } = await api.put(endpoint, formData, { headers: { "Content-Type": "multipart/form-data" } });
      onSaved(data);
      cancel();
      toastSuccess("Logo guardado");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos subir el logo"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const confirmed = await confirmDelete(`el ${title.toLowerCase()}`);
    if (!confirmed) return;
    setBusy(true);
    try {
      await onRemove();
      toastSuccess("Logo quitado");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos quitar el logo"));
    } finally {
      setBusy(false);
    }
  }

  const shown = preview || current;

  return (
    <div className="rounded-xl border border-ink-100 p-4">
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      <p className="mt-0.5 text-xs text-ink-500">{help}</p>

      <div className={`mt-3 flex h-28 items-center justify-center rounded-xl border border-dashed border-ink-200 p-3 ${previewBg}`}>
        {shown ? (
          <img src={shown} alt="" className={`h-full max-w-full object-contain ${imgClass}`} />
        ) : (
          <span className="flex flex-col items-center gap-1 text-center text-xs text-ink-400">
            <ImageOff className="h-5 w-5" />
            {fallbackText}
          </span>
        )}
      </div>
      {preview && <p className="mt-1 text-xs font-semibold text-brand-600">Vista previa: todavía no está guardado</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!file && <FileInput key={fileKey} accept=".png,.jpg,.jpeg,.webp,.svg" buttonLabel={current ? "Reemplazar logo" : "Elegir logo"} onChange={choose} />}
        {file && (
          <>
            <Button type="button" size="sm" onClick={upload} disabled={busy}>
              {busy ? <Spinner className="h-4 w-4" /> : "Guardar logo"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={cancel} disabled={busy}>
              Cancelar
            </Button>
          </>
        )}
        {!file && current && onRemove && (
          <button type="button" onClick={remove} disabled={busy} className="text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50">
            Quitar
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-400">PNG, JPG, WEBP o SVG, hasta 4 MB. Mejor con fondo transparente.</p>
    </div>
  );
}

// Sección "Logos": el de la solapa (principal) y el de la franja blanca de arriba.
export function LogosSection({ config, onSaved }) {
  const setGlobalConfig = useSiteConfigStore((s) => s.setConfig);

  function saved(data) {
    setGlobalConfig(data);
    onSaved?.(data);
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <p className="text-sm font-semibold text-ink-900">Logos</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <LogoField
          title="Logo principal"
          help="El de la solapa roja del menú y el pie de página. Se ve en blanco sobre el rojo."
          current={config?.logo?.url}
          fallbackText="Sin logo"
          endpoint="/site-config/logo"
          previewBg="bg-brand-600"
          imgClass="brightness-0 invert"
          onSaved={saved}
        />
        <LogoField
          title="Logo de la franja blanca"
          help="El que se ve centrado en la franja blanca de arriba del menú. Si no cargás uno, se usa el principal."
          current={config?.secondaryLogo?.url}
          fallbackText="Se usa el logo principal"
          endpoint="/site-config/secondary-logo"
          previewBg="bg-white"
          onSaved={saved}
          onRemove={async () => saved((await api.delete("/site-config/secondary-logo")).data)}
        />
      </div>
    </div>
  );
}
