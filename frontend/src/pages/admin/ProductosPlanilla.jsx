import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Eye, FileSpreadsheet, Upload } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { FileInput } from "../../components/ui/FileInput";
import { Spinner } from "../../components/ui/Spinner";
import { confirmAction, resultAlert, toastError, toastSuccess } from "../../lib/alerts";
import { downloadFromApi } from "../../lib/download";
import { formatCurrency } from "../../lib/format";
import { SummaryCard, CollapsibleList } from "../../components/admin/ImportPreview";

// Qué columna de la planilla se toma. Las demás no se tocan aunque vengan en el archivo.
const UPDATE_OPTIONS = [
  { value: "price", label: "Solo el precio" },
  { value: "stock", label: "Solo el stock" },
  { value: "category", label: "Solo la categoría" },
  { value: "name", label: "Solo el nombre del producto" },
  { value: "price,stock", label: "Precio y stock" },
  { value: "name,price,category,stock", label: "Todas las columnas" }
];

const showValue = (field, value) => (field === "price" ? formatCurrency(value) : value === "" || value == null ? "—" : value);

// Planilla única de productos: se descarga con todos los productos, se edita en
// Excel y se vuelve a subir eligiendo qué columnas actualizar. Antes de guardar
// se ve qué cambia, qué se crea y qué filas tienen errores.
export default function ProductosPlanilla() {
  const [downloading, setDownloading] = useState(false);
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [fields, setFields] = useState(["price"]);
  const [createMissing, setCreateMissing] = useState(false);
  const [loading, setLoading] = useState(null); // "preview" | "apply" | null
  const [preview, setPreview] = useState(null);

  async function download() {
    const confirmed = await confirmAction({
      title: "¿Descargar la planilla?",
      text: "Se va a descargar un Excel con el código, el nombre, el precio, la categoría y el stock de todos los productos.",
      confirmText: "Sí, descargar",
      icon: "question"
    });
    if (!confirmed) return;
    setDownloading(true);
    try {
      await downloadFromApi("/products/export/sheet", { fallbackName: "productos.xlsx" });
      toastSuccess("Planilla descargada");
    } catch (err) {
      toastError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  async function send(dryRun) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/products/import/sheet", formData, {
      params: { dryRun: String(dryRun), fields: fields.join(","), createMissing: String(createMissing) },
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  }

  function reset() {
    setPreview(null);
    setFile(null);
    setFileInputKey((k) => k + 1);
  }

  // Cualquier cambio en las opciones obliga a ver la vista previa de nuevo.
  function chooseFields(value) {
    setPreview(null);
    setFields(value.split(","));
  }

  async function showPreview() {
    if (!file) return toastError("Primero elegí la planilla");
    if (!fields.length && !createMissing) return toastError("Elegí al menos una columna para actualizar");
    setLoading("preview");
    try {
      setPreview(await send(true));
    } catch (err) {
      setPreview(null);
      toastError(apiErrorMessage(err, "No pudimos leer la planilla"));
    } finally {
      setLoading(null);
    }
  }

  async function apply() {
    const parts = [];
    if (preview.toUpdate.length) parts.push(`actualizar ${preview.toUpdate.length} producto(s)`);
    if (preview.toCreate.length) parts.push(`crear ${preview.toCreate.length} producto(s) nuevo(s)`);
    const confirmed = await confirmAction({
      title: "¿Guardar los cambios?",
      text: `Vas a ${parts.join(" y ")}. Se aplica en la tienda al instante.`,
      confirmText: "Sí, guardar",
      icon: "question"
    });
    if (!confirmed) return;
    setLoading("apply");
    try {
      const result = await send(false);
      await resultAlert({
        title: "¡Listo!",
        text: `${result.toUpdate.length} actualizado(s), ${result.created} creado(s) y ${result.errors.length} con error.`,
        icon: result.errors.length ? "warning" : "success"
      });
      reset();
    } catch (err) {
      resultAlert({ title: "No pudimos guardar", text: apiErrorMessage(err, "Probá de nuevo en unos minutos."), icon: "error" });
    } finally {
      setLoading(null);
    }
  }

  const nothingToSave = preview && !preview.toUpdate.length && !preview.toCreate.length;

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/admin/productos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Productos
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Planilla de productos</h1>
      <p className="mt-1 text-sm text-ink-600">
        Un solo Excel para todo: <b>Código/ID, Producto, Precio, Categoría y Stock</b>. Descargalo, cambiá lo que necesites y
        volvé a subirlo. Antes de guardar vas a ver qué cambia. Nunca se borran productos.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">1</span>
            Descargar la planilla
          </p>
          <p className="mt-2 text-sm text-ink-600">Con todos los productos de la tienda, lista para editar.</p>
          <Button className="mt-4" variant="outline" onClick={download} disabled={downloading}>
            {downloading ? <Spinner className="h-4 w-4" /> : <Download className="h-4 w-4" strokeWidth={2} />}
            Descargar planilla de productos
          </Button>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600">2</span>
            Subir planilla de productos
          </p>
          <p className="mt-2 text-sm text-ink-600">Primero elegí qué querés actualizar; después, el archivo.</p>

          <label className="mt-4 block text-sm font-medium text-ink-700">
            a) ¿Qué querés actualizar?
            <select
              aria-label="Qué columna actualizar"
              value={fields.join(",")}
              onChange={(e) => chooseFields(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-900 outline-none focus:border-brand-500"
            >
              {UPDATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-ink-500">Se toma solo eso de la planilla; lo demás queda como está.</span>
          </label>

          <label className="mt-4 block text-sm font-medium text-ink-700">
            b) Si un producto de la planilla no está en la tienda
            <select
              aria-label="Productos que no están en la tienda"
              value={String(createMissing)}
              onChange={(e) => {
                setCreateMissing(e.target.value === "true");
                setPreview(null);
              }}
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-900 outline-none focus:border-brand-500"
            >
              <option value="false">Ignorarlo (no se crea nada nuevo)</option>
              <option value="true">Crearlo (necesita nombre, precio y una categoría que exista)</option>
            </select>
          </label>

          <div className="mt-4">
            <p className="mb-1.5 text-sm font-medium text-ink-700">c) Elegí el archivo (Excel o PDF)</p>
            <FileInput
              key={fileInputKey}
              accept=".xlsx,.xls,.ods,.csv,.pdf"
              buttonLabel="Elegir planilla"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setPreview(null);
              }}
            />
          </div>

          <Button className="mt-4" onClick={showPreview} disabled={!file || Boolean(loading)}>
            {loading === "preview" ? <Spinner className="h-4 w-4" /> : <Eye className="h-4 w-4" strokeWidth={2} />}
            Ver qué va a cambiar
          </Button>
        </div>
      </div>

      {preview && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <SummaryCard label="Se actualizan" value={preview.toUpdate.length} tone="good" />
            <SummaryCard label="Se crean" value={preview.toCreate.length} tone={preview.toCreate.length ? "good" : "neutral"} />
            <SummaryCard label="Sin cambios" value={preview.unchanged} tone="neutral" />
            <SummaryCard label="Ignorados" value={preview.ignored.length} tone="neutral" />
            <SummaryCard label="Con errores" value={preview.errors.length} tone={preview.errors.length ? "bad" : "neutral"} />
          </div>

          {preview.toUpdate.length > 0 && (
            <div className="mt-4 max-h-[30rem] overflow-auto rounded-2xl border border-ink-100 bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="sticky top-0 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Qué cambia</th>
                    <th className="px-4 py-3">Ahora</th>
                    <th className="px-4 py-3">Queda</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.toUpdate.flatMap((u) =>
                    u.changes.map((c, i) => (
                      <tr key={`${u.row}-${c.field}`} className={i === 0 ? "border-t border-ink-100" : ""}>
                        <td className="px-4 py-2 text-ink-900">{i === 0 && u.name}</td>
                        <td className="px-4 py-2 text-ink-600">{c.label}</td>
                        <td className="px-4 py-2 text-ink-500">{showValue(c.field, c.before)}</td>
                        <td className="px-4 py-2 font-semibold text-ink-900">→ {showValue(c.field, c.after)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {nothingToSave && (
            <p className="mt-4 rounded-2xl border border-ink-100 bg-white px-5 py-6 text-center text-sm text-ink-500">
              Con esta planilla y estas opciones no cambia nada.
            </p>
          )}

          <CollapsibleList title="Productos nuevos que se van a crear" count={preview.toCreate.length}>
            <ul className="divide-y divide-ink-50">
              {preview.toCreate.map((c) => (
                <li key={c.row} className="flex flex-wrap justify-between gap-2 px-5 py-2 text-sm">
                  <span className="text-ink-900">{c.name}</span>
                  <span className="text-ink-500">
                    {formatCurrency(c.price)} · {c.category} · stock {c.stock}
                  </span>
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

          <CollapsibleList title="Productos que no están en la tienda (se ignoran)" count={preview.ignored.length}>
            <ul className="divide-y divide-ink-50">
              {preview.ignored.map((n) => (
                <li key={n.row} className="px-5 py-2 text-sm text-ink-800">
                  <span className="mr-2 text-xs text-ink-500">Fila {n.row}</span>
                  {n.name}
                </li>
              ))}
            </ul>
          </CollapsibleList>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={apply} disabled={nothingToSave || Boolean(loading)}>
              {loading === "apply" ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" strokeWidth={2} />}
              Guardar cambios
            </Button>
            <Button variant="ghost" onClick={reset} disabled={Boolean(loading)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <p className="mt-8 flex items-start gap-2 text-xs text-ink-500">
        <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
        <span>
          Consejo: no cambies la columna Código/ID; así cada fila se reconoce con su producto.
        </span>
      </p>
    </div>
  );
}
