import { useState } from "react";
import { CheckCircle2, Download, Upload } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { FileInput } from "../../components/ui/FileInput";
import { Spinner } from "../../components/ui/Spinner";
import { confirmAction, toastSuccess, toastError } from "../../lib/alerts";
import { downloadFromApi } from "../../lib/download";
import { formatCurrency } from "../../lib/format";
import { SummaryCard, CollapsibleList } from "./ProductosImportar";

// Marcar pedidos como entregados con un Excel: se descarga la lista de los que
// faltan entregar, se pone "SI" en los entregados y se vuelve a subir.
export default function DeliveredImport({ onDone }) {
  const [downloading, setDownloading] = useState(false);
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(null); // "preview" | "apply" | null
  const [preview, setPreview] = useState(null);

  async function downloadTemplate() {
    const confirmed = await confirmAction({
      title: "¿Descargar los pedidos a entregar?",
      text: 'Se descarga un Excel con los pedidos pagados que todavía no se entregaron. Poné "SI" en la columna "Entregado" de los que ya entregaste.',
      confirmText: "Sí, descargar",
      icon: "question"
    });
    if (!confirmed) return;
    setDownloading(true);
    try {
      await downloadFromApi("/orders/export/pending-delivery", { fallbackName: "pedidos-a-entregar.xlsx" });
      toastSuccess("Excel descargado");
    } catch (err) {
      toastError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  async function send(selectedFile, dryRun) {
    const formData = new FormData();
    formData.append("file", selectedFile);
    const { data } = await api.post("/orders/import/delivered", formData, {
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
    const confirmed = await confirmAction({
      title: "¿Marcar como entregados?",
      text: `Vas a marcar ${preview.toDeliver.length} pedido(s) como entregados.`,
      confirmText: "Sí, marcar",
      icon: "question"
    });
    if (!confirmed) return;
    setLoading("apply");
    try {
      const result = await send(file, false);
      toastSuccess(`Listo: ${result.delivered} pedido(s) marcados como entregados`);
      if (result.delivered < preview.toDeliver.length) toastError("Algunos pedidos no se pudieron marcar: revisá la lista de errores");
      reset();
      onDone?.();
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos marcar los pedidos"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-ink-100 bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
        <CheckCircle2 className="h-4 w-4 text-brand-600" />
        Cargar pedidos entregados con Excel
      </p>
      <p className="mt-1 text-xs text-ink-500">
        Así no tenés que cambiarlos uno por uno: descargá la lista, poné <b>SI</b> en la columna <b>Entregado</b> de los que
        entregaste (y la fecha si no fue hoy) y subila.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={downloadTemplate} disabled={downloading}>
          {downloading ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" strokeWidth={2} />}
          1. Descargar pedidos a entregar
        </Button>
        <FileInput
          key={fileInputKey}
          accept=".xlsx,.xls,.ods,.csv"
          buttonLabel="2. Subir el Excel completado"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
        {loading === "preview" && (
          <span className="flex items-center gap-2 text-sm text-ink-500">
            <Spinner className="h-4 w-4" /> Leyendo el archivo...
          </span>
        )}
      </div>

      {preview && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Se marcan entregados" value={preview.toDeliver.length} tone="good" />
            <SummaryCard label="Ya estaban entregados" value={preview.alreadyDelivered.length} tone="neutral" />
            <SummaryCard label="Sin marcar (no se tocan)" value={preview.skipped} tone="neutral" />
            <SummaryCard label="Con problemas" value={preview.errors.length} tone={preview.errors.length ? "bad" : "neutral"} />
          </div>

          {preview.toDeliver.length > 0 ? (
            <div className="mt-4 max-h-80 overflow-auto rounded-2xl border border-ink-100">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="sticky top-0 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-2.5">Pedido</th>
                    <th className="px-4 py-2.5">Cliente</th>
                    <th className="px-4 py-2.5">Estado actual</th>
                    <th className="px-4 py-2.5">Entregado el</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.toDeliver.map((o) => (
                    <tr key={o.code} className="border-t border-ink-50">
                      <td className="px-4 py-2 font-semibold text-ink-900">{o.code}</td>
                      <td className="px-4 py-2 text-ink-700">{o.customer}</td>
                      <td className="px-4 py-2 text-ink-500">{o.from}</td>
                      <td className="px-4 py-2 text-ink-700">{o.deliveredAt}</td>
                      <td className="px-4 py-2 text-right text-ink-900">{formatCurrency(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-ink-100 px-5 py-5 text-center text-sm text-ink-500">
              No hay pedidos para marcar. ¿Pusiste "SI" en la columna "Entregado"?
            </p>
          )}

          <CollapsibleList title="Pedidos con problemas (no se marcan)" count={preview.errors.length} tone="bad">
            <ul className="divide-y divide-ink-50">
              {preview.errors.map((e) => (
                <li key={`${e.row}-${e.message}`} className="px-5 py-2 text-sm">
                  <span className="mr-2 text-xs text-ink-500">Fila {e.row}</span>
                  <span className="font-semibold text-ink-800">{e.code}</span>
                  {e.customer && <span className="ml-2 text-ink-600">{e.customer}</span>}
                  <p className="text-xs text-brand-600">{e.message}</p>
                </li>
              ))}
            </ul>
          </CollapsibleList>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={apply} disabled={!preview.toDeliver.length || Boolean(loading)}>
              {loading === "apply" ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <>
                  <Upload className="h-4 w-4" strokeWidth={2} />
                  Marcar {preview.toDeliver.length} pedido(s) como entregados
                </>
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
