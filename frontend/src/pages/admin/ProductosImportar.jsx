import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { FileInput } from "../../components/ui/FileInput";
import { Spinner } from "../../components/ui/Spinner";
import { confirmAction, toastSuccess, toastError } from "../../lib/alerts";
import { formatCurrency } from "../../lib/format";

function SummaryCard({ label, value, tone }) {
  const tones = {
    neutral: "border-ink-100 bg-white text-ink-900",
    good: "border-brand-200 bg-brand-50 text-brand-800",
    bad: "border-danger-200 bg-danger-50 text-danger-800"
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}


function percentChange(oldPrice, newPrice) {
  if (!oldPrice) return "";
  const pct = ((newPrice - oldPrice) / oldPrice) * 100;
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function CollapsibleList({ title, count, tone = "neutral", children }) {
  const [open, setOpen] = useState(false);
  if (!count) return null;
  const tones = { neutral: "text-ink-800", bad: "text-danger-700" };
  return (
    <div className="mt-4 rounded-2xl border border-ink-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold ${tones[tone]}`}
      >
        {title} ({count})
        <span className="text-xs font-semibold text-brand-600">{open ? "Ocultar" : "Ver lista"}</span>
      </button>
      {open && <div className="max-h-80 overflow-y-auto border-t border-ink-50">{children}</div>}
    </div>
  );
}

// Una sola carga para todo: con la lista del proveedor se dan de alta los
// productos que no existen y se actualiza el precio de los que ya están.
// Subir la misma lista otra vez nunca duplica: los reconoce por nombre/código.
function PriceUpdate() {
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(null); // "preview" | "apply" | null
  const [preview, setPreview] = useState(null);

  async function send(selectedFile, dryRun) {
    const formData = new FormData();
    formData.append("file", selectedFile);
    const { data } = await api.post("/products/import/prices", formData, {
      params: { dryRun: dryRun ? "true" : undefined },
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  }

  function reset() {
    setPreview(null);
    setFile(null);
    setFileInputKey((k) => k + 1);
  }

  // Al elegir el archivo se muestra enseguida qué va a pasar (sin guardar nada).
  async function handleFile(selectedFile) {
    setFile(selectedFile);
    setPreview(null);
    if (!selectedFile) return;
    setLoading("preview");
    try {
      setPreview(await send(selectedFile, true));
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos leer el archivo"));
    } finally {
      setLoading(null);
    }
  }

  async function apply() {
    const parts = [];
    if (preview.created.length) parts.push(`crear ${preview.created.length} producto(s) nuevo(s)`);
    if (preview.changed.length) parts.push(`actualizar ${preview.changed.length} precio(s)`);
    const confirmed = await confirmAction({
      title: "¿Guardar los cambios?",
      text: `Vas a ${parts.join(" y ")}. Se aplica en la tienda al instante.`,
      confirmText: "Sí, guardar",
      icon: "question"
    });
    if (!confirmed) return;
    setLoading("apply");
    try {
      const result = await send(file, false);
      const done = [];
      if (result.created.length) done.push(`${result.created.length} producto(s) creados`);
      if (result.changed.length) done.push(`${result.changed.length} precio(s) actualizados`);
      toastSuccess(`Listo: ${done.join(" y ")}`);
      if (result.errors.length) toastError(`${result.errors.length} fila(s) no se pudieron guardar: revisá la lista de errores`);
      reset();
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos guardar los cambios"));
    } finally {
      setLoading(null);
    }
  }

  const bigChanges = preview?.changed.filter((c) => c.bigChange).length || 0;
  const pendingChanges = (preview?.created.length || 0) + (preview?.changed.length || 0);

  return (
    <div>
      <div className="rounded-2xl border border-ink-100 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <FileSpreadsheet className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">Subí la lista de precios</p>
            <p className="mt-0.5 text-sm text-ink-600">
              La lista del proveedor en <b>PDF</b>, <b>Excel</b> o <b>CSV</b>. Los productos que ya están en la tienda solo
              actualizan su precio y los que faltan se crean. Podés subir la misma lista todas las veces que quieras: nunca se
              duplican productos.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <FileInput
            key={fileInputKey}
            accept=".xlsx,.xls,.ods,.csv,.pdf"
            buttonLabel="Elegir archivo"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          {loading === "preview" && (
            <span className="flex items-center gap-2 text-sm text-ink-500">
              <Spinner className="h-4 w-4" /> Leyendo la lista...
            </span>
          )}
        </div>
      </div>

      {preview && (
        <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-4">
            <SummaryCard label="Productos nuevos" value={preview.created.length} tone="good" />
            <SummaryCard label="Precios que cambian" value={preview.changed.length} tone="good" />
            <SummaryCard label="Sin cambios" value={preview.unchanged} tone="neutral" />
            <SummaryCard label="Con errores" value={preview.errors.length} tone={preview.errors.length ? "bad" : "neutral"} />
          </div>

          {bigChanges > 0 && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-800">
              <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
              {bigChanges} precio(s) cambian más de un 50%: revisalos antes de confirmar (están marcados en la tabla).
            </p>
          )}

          {preview.changed.length > 0 ? (
            <div className="mt-4 max-h-[28rem] overflow-auto rounded-2xl border border-ink-100 bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="sticky top-0 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3 text-right">Precio actual</th>
                    <th className="px-4 py-3 text-right">Precio nuevo</th>
                    <th className="px-4 py-3 text-right">Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.changed.map((c) => (
                    <tr key={c.row} className={`border-t ${c.bigChange ? "border-danger-100 bg-danger-50" : "border-ink-50"}`}>
                      <td className="px-4 py-2.5 text-ink-900">
                        {c.name}
                        {c.bigChange && <span className="ml-2 text-xs font-semibold text-danger-700">Revisar</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-ink-500">{formatCurrency(c.oldPrice)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-ink-900">{formatCurrency(c.newPrice)}</td>
                      <td
                        className={`px-4 py-2.5 text-right text-xs font-semibold ${
                          c.newPrice > c.oldPrice ? "text-danger-700" : "text-brand-700"
                        }`}
                      >
                        {percentChange(c.oldPrice, c.newPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-ink-100 bg-white px-5 py-6 text-center text-sm text-ink-500">
              Ningún precio de los productos que ya están en la tienda cambia con esta lista.
            </p>
          )}

          <CollapsibleList title="Productos nuevos que se van a crear" count={preview.created.length}>
            <ul className="divide-y divide-ink-50">
              {preview.created.map((n) => (
                <li key={n.row} className="flex justify-between gap-4 px-5 py-2 text-sm">
                  <span className="text-ink-800">
                    <span className="mr-2 text-xs text-ink-500">Fila {n.row}</span>
                    {n.name}
                    <span className="ml-2 text-xs text-ink-500">· {n.category}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-ink-900">{formatCurrency(n.price)}</span>
                </li>
              ))}
            </ul>
          </CollapsibleList>

          <CollapsibleList title="Filas con errores" count={preview.errors.length} tone="bad">
            <ul className="divide-y divide-ink-50">
              {preview.errors.map((e) => (
                <li key={`${e.row}-${e.message}`} className="px-5 py-2 text-sm">
                  <span className="mr-2 text-xs text-ink-500">Fila {e.row}</span>
                  <span className="text-ink-800">{e.name}</span>
                  <p className="text-xs text-danger-700">{e.message}</p>
                </li>
              ))}
            </ul>
          </CollapsibleList>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={apply} disabled={!pendingChanges || Boolean(loading)}>
              {loading === "apply" ? (
                <Spinner className="h-4 w-4" />
              ) : (
                [
                  preview.created.length && `Crear ${preview.created.length} producto(s)`,
                  preview.changed.length && `actualizar ${preview.changed.length} precio(s)`
                ]
                  .filter(Boolean)
                  .join(" y ")
                  .replace(/^a/, "A") || "Sin cambios para guardar"
              )}
            </Button>
            <Button variant="ghost" onClick={reset} disabled={Boolean(loading)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductosImportar() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/productos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Productos
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Cargar y actualizar productos</h1>
      <p className="mt-1 text-sm text-ink-600">
        La primera vez, la lista da de alta los productos con su precio. Después, cada vez que te llegue la lista nueva, subila
        acá: se crean solo los productos que falten y se cambian solo los precios que sean distintos.
      </p>
      <div className="mt-6">
        <PriceUpdate />
      </div>
    </div>
  );
}
