import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, FileSpreadsheet, Upload } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { FileInput } from "../../components/ui/FileInput";
import { Spinner } from "../../components/ui/Spinner";
import { confirmAction, toastSuccess, toastError } from "../../lib/alerts";
import { downloadFromApi } from "../../lib/download";
import { SummaryCard, CollapsibleList } from "./ProductosImportar";

// Stock en Excel: se descarga la planilla con el stock actual, se corrige la
// columna "Stock" y se vuelve a subir. Antes de guardar se ve qué cambia.
export default function StockExcel() {
  const [downloading, setDownloading] = useState(false);
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(null); // "preview" | "apply" | null
  const [preview, setPreview] = useState(null);

  async function download() {
    const confirmed = await confirmAction({
      title: "¿Descargar el stock?",
      text: "Se va a descargar un Excel con el nombre, la categoría, el precio y el stock de todos los productos.",
      confirmText: "Sí, descargar",
      icon: "question"
    });
    if (!confirmed) return;
    setDownloading(true);
    try {
      await downloadFromApi("/products/export/stock", { fallbackName: "stock.xlsx" });
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
    const { data } = await api.post("/products/import/stock", formData, {
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

  // Al elegir el archivo se muestra qué va a cambiar, sin guardar nada.
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
      title: "¿Actualizar el stock?",
      text: `Vas a cambiar el stock de ${preview.changed.length} producto(s). Se aplica en la tienda al instante.`,
      confirmText: "Sí, actualizar",
      icon: "question"
    });
    if (!confirmed) return;
    setLoading("apply");
    try {
      const result = await send(file, false);
      toastSuccess(`Listo: stock actualizado en ${result.changed.length} producto(s)`);
      reset();
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos guardar los cambios"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/productos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Productos
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Stock en Excel</h1>
      <p className="mt-1 text-sm text-ink-600">
        Descargá el Excel, cambiá los números de la columna <b>Stock</b> y volvé a subirlo. Antes de guardar vas a ver qué
        productos cambian. No se crean ni se borran productos.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">1</span>
            Descargar el stock actual
          </p>
          <p className="mt-2 text-sm text-ink-600">Nombre, categoría, precio y stock de todos los productos.</p>
          <Button className="mt-4" variant="outline" onClick={download} disabled={downloading}>
            {downloading ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" strokeWidth={2} />}
            Descargar Excel
          </Button>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">2</span>
            Subir el Excel con el stock nuevo
          </p>
          <p className="mt-2 text-sm text-ink-600">
            Tiene que tener una columna <b>Stock</b> y otra <b>Producto</b> o <b>Código</b>.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <FileInput
              key={fileInputKey}
              accept=".xlsx,.xls,.ods,.csv"
              buttonLabel="Elegir archivo"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
            {loading === "preview" && (
              <span className="flex items-center gap-2 text-sm text-ink-500">
                <Spinner className="h-4 w-4" /> Leyendo el archivo...
              </span>
            )}
          </div>
        </div>
      </div>

      {preview && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Stock que cambia" value={preview.changed.length} tone="good" />
            <SummaryCard label="Sin cambios" value={preview.unchanged} tone="neutral" />
            <SummaryCard label="No encontrados" value={preview.notFound.length} tone={preview.notFound.length ? "bad" : "neutral"} />
            <SummaryCard label="Con errores" value={preview.errors.length} tone={preview.errors.length ? "bad" : "neutral"} />
          </div>

          {preview.changed.length > 0 ? (
            <div className="mt-4 max-h-[28rem] overflow-auto rounded-2xl border border-ink-100 bg-white">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="sticky top-0 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3 text-right">Stock actual</th>
                    <th className="px-4 py-3 text-right">Stock nuevo</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.changed.map((c) => (
                    <tr key={c.row} className="border-t border-ink-50">
                      <td className="px-4 py-2.5 text-ink-900">
                        {c.name}
                        {c.sku && <span className="ml-2 text-xs text-ink-500">{c.sku}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-ink-500">{c.before}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${c.after === 0 ? "text-danger-700" : "text-ink-900"}`}>
                        {c.after}
                        {c.after === 0 && <span className="ml-1 text-xs font-normal">(sin stock)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-ink-100 bg-white px-5 py-6 text-center text-sm text-ink-500">
              Ningún stock cambia con este archivo.
            </p>
          )}

          <CollapsibleList title="Productos que no están en la tienda (se ignoran)" count={preview.notFound.length} tone="bad">
            <ul className="divide-y divide-ink-50">
              {preview.notFound.map((n) => (
                <li key={n.row} className="px-5 py-2 text-sm text-ink-800">
                  <span className="mr-2 text-xs text-ink-500">Fila {n.row}</span>
                  {n.name}
                </li>
              ))}
            </ul>
          </CollapsibleList>

          <CollapsibleList title="Filas con errores (no se guardan)" count={preview.errors.length} tone="bad">
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
            <Button onClick={apply} disabled={!preview.changed.length || Boolean(loading)}>
              {loading === "apply" ? (
                <Spinner className="h-4 w-4" />
              ) : preview.changed.length ? (
                <>
                  <Upload className="h-4 w-4" strokeWidth={2} />
                  Actualizar stock de {preview.changed.length} producto(s)
                </>
              ) : (
                "Sin cambios para guardar"
              )}
            </Button>
            <Button variant="ghost" onClick={reset} disabled={Boolean(loading)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {!preview && (
        <p className="mt-6 flex items-start gap-2 text-xs text-ink-500">
          <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          Consejo: no cambies los nombres ni los códigos del Excel descargado; así cada fila se reconoce con su producto.
        </p>
      )}
    </div>
  );
}
