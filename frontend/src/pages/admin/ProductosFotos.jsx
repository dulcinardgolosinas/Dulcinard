import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, ImagePlus } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { confirmAction, toastSuccess, toastError } from "../../lib/alerts";
import { CatalogoFotos } from "./CatalogoFotos";

// Subidas en paralelo: suficiente para ir rápido sin saturar la conexión.
const CONCURRENCY = 3;
// Las fotos de celular pesan varios MB: se achican en el navegador antes de
// subirlas (el servidor acepta hasta ~4MB por envío).
const MAX_SIDE = 1600;

async function resizeImage(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; // los PNG con transparencia quedan sobre blanco
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) throw new Error("toBlob");
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    // Formato que el navegador no puede abrir (ej: HEIC de iPhone): se manda tal cual si es chico.
    if (file.size <= 4 * 1024 * 1024) return file;
    throw new Error("No se pudo procesar la foto (si es HEIC de iPhone, convertila a JPG)");
  }
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    neutral: "border-ink-100 bg-white text-ink-900",
    good: "border-brand-200 bg-brand-50 text-brand-600",
    bad: "border-danger-200 bg-danger-50 text-danger-800"
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

export default function ProductosFotos() {
  const inputRef = useRef(null);
  const [items, setItems] = useState([]); // { file, url, fileName, status, productName, replacesImage, message, upload }
  const [matching, setMatching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [missingCount, setMissingCount] = useState(null);
  const [tab, setTab] = useState("catalog");

  useEffect(() => {
    api.get("/products/images/missing").then(({ data }) => setMissingCount(data.length)).catch(() => {});
  }, []);

  // Libera las vistas previas al salir de la página.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  async function downloadMissingList() {
    try {
      const { data } = await api.get("/products/images/missing");
      if (!data.length) return toastSuccess("Todos los productos tienen foto");
      const text = ["Nombre que tiene que tener cada foto (más .jpg o .png):", "", ...data.map((p) => p.fileName)].join("\r\n");
      const url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "productos-sin-foto.txt";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos descargar la lista"));
    }
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(f.name));
    if (!files.length) return toastError("Elegí archivos de imagen (JPG, PNG o WEBP)");
    items.forEach((i) => URL.revokeObjectURL(i.url));
    setItems([]);
    setMatching(true);
    try {
      const { data } = await api.post("/products/images/match", { fileNames: files.map((f) => f.name) });
      setItems(data.results.map((r, i) => ({ ...r, file: files[i], url: URL.createObjectURL(files[i]), upload: null })));
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos revisar las fotos"));
    } finally {
      setMatching(false);
    }
  }

  async function uploadAll(onlyFailed = false) {
    const queue = items.filter((i) => i.status === "matched" && (onlyFailed ? i.upload === "error" : i.upload !== "done"));
    if (!queue.length) return;
    const replacing = queue.filter((i) => i.replacesImage).length;
    const confirmed = await confirmAction({
      title: `¿Subir ${queue.length} foto(s)?`,
      text: replacing
        ? `${replacing} producto(s) ya tienen foto principal: se va a reemplazar por la nueva.`
        : "Cada foto queda como la principal de su producto.",
      confirmText: "Sí, subir",
      icon: "question"
    });
    if (!confirmed) return;

    setUploading(true);
    setProgress({ done: 0, total: queue.length });
    const setUpload = (fileName, patch) =>
      setItems((prev) => prev.map((i) => (i.fileName === fileName ? { ...i, ...patch } : i)));

    let next = 0;
    let failed = 0;
    async function worker() {
      while (next < queue.length) {
        const item = queue[next++];
        setUpload(item.fileName, { upload: "uploading", message: "" });
        try {
          const image = await resizeImage(item.file);
          const formData = new FormData();
          formData.append("image", image);
          await api.put(`/products/${item.productId}/main-image`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          setUpload(item.fileName, { upload: "done", replacesImage: true });
        } catch (err) {
          failed++;
          setUpload(item.fileName, { upload: "error", message: apiErrorMessage(err, err.message || "No se pudo subir") });
        } finally {
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
    setUploading(false);
    api.get("/products/images/missing").then(({ data }) => setMissingCount(data.length)).catch(() => {});

    if (failed) toastError(`${queue.length - failed} subidas, ${failed} con error: podés reintentarlas`);
    else toastSuccess(`Listo: ${queue.length} foto(s) subidas`);
  }

  function reset() {
    items.forEach((i) => URL.revokeObjectURL(i.url));
    setItems([]);
    setProgress({ done: 0, total: 0 });
  }

  const matched = items.filter((i) => i.status === "matched");
  const unmatched = items.filter((i) => i.status === "unmatched");
  const problems = items.filter((i) => i.status === "error");
  const pending = matched.filter((i) => i.upload !== "done");
  const failedUploads = matched.filter((i) => i.upload === "error");

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/productos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Productos
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">Subir fotos de productos</h1>
      <div className="mt-5 flex gap-1 rounded-full bg-ink-100 p-1 sm:w-fit">
        {[
          ["catalog", "Desde el catálogo PDF"],
          ["files", "Fotos sueltas"]
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
              tab === value ? "bg-white text-brand-600 shadow-sm" : "text-ink-600 hover:text-ink-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "catalog" ? (
          <CatalogoFotos />
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-600">
              Nombrá cada foto <b>igual que el producto</b> (por ejemplo <i>ALF. TOFI TRIPLE X 78 GR NEGRO.jpg</i>) y subilas todas
              juntas: cada una se asigna sola a su producto. No importan las mayúsculas, los acentos ni los signos. Si un producto ya
              tiene foto, la nueva la reemplaza.
            </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4">
        <p className="flex-1 text-sm text-ink-700">
          {missingCount === null
            ? "Revisando productos sin foto..."
            : missingCount === 0
              ? "Todos los productos tienen foto."
              : `${missingCount} producto(s) todavía no tienen foto.`}
        </p>
        {missingCount > 0 && (
          <Button variant="outline" size="sm" onClick={downloadMissingList}>
            <Download className="h-4 w-4" strokeWidth={2} />
            Descargar nombres para las fotos
          </Button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!uploading) handleFiles(e.dataTransfer.files);
        }}
        className={`mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver ? "border-brand-600 bg-brand-50" : "border-ink-200 bg-white"
        }`}
      >
        <ImagePlus className="h-10 w-10 text-brand-600" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-ink-900">Arrastrá las fotos acá</p>
        <p className="text-xs text-ink-500">o elegilas desde la carpeta (con Ctrl+A seleccionás todas)</p>
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading || matching}>
          {matching ? <Spinner className="h-4 w-4" /> : "Elegir fotos"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Se asignan a un producto" value={matched.length} tone="good" />
            <SummaryCard label="Sin producto con ese nombre" value={unmatched.length} tone={unmatched.length ? "bad" : "neutral"} />
            <SummaryCard label="Con algún problema" value={problems.length} tone={problems.length ? "bad" : "neutral"} />
          </div>

          {uploading && (
            <div className="mt-4">
              <p className="text-sm text-ink-700">
                Subiendo {progress.done} de {progress.total}...
              </p>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full bg-brand-600 transition-all"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => uploadAll(false)} disabled={uploading || !pending.length}>
              {uploading ? <Spinner className="h-4 w-4" /> : pending.length ? `Subir ${pending.length} foto(s)` : "Fotos subidas"}
            </Button>
            {failedUploads.length > 0 && !uploading && (
              <Button variant="outline" onClick={() => uploadAll(true)}>
                Reintentar {failedUploads.length} con error
              </Button>
            )}
            <Button variant="ghost" onClick={reset} disabled={uploading}>
              {pending.length ? "Cancelar" : "Subir más fotos"}
            </Button>
          </div>

          {(unmatched.length > 0 || problems.length > 0) && (
            <div className="mt-6 rounded-2xl border border-danger-200 bg-white">
              <p className="border-b border-danger-100 px-5 py-3 text-sm font-semibold text-danger-800">
                Estas fotos no se van a subir
              </p>
              <ul className="max-h-72 divide-y divide-ink-50 overflow-y-auto">
                {[...unmatched, ...problems].map((i) => (
                  <li key={i.fileName} className="flex items-center gap-3 px-5 py-2 text-sm">
                    <img src={i.url} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-lg border border-ink-100 bg-white object-contain" />
                    <div className="min-w-0">
                      <p className="truncate text-ink-900">{i.fileName}</p>
                      <p className="text-xs text-danger-700">
                        {i.message}
                        {i.status === "unmatched" && " — renombrala igual que el producto"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {matched.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
              <p className="border-b border-ink-100 px-5 py-3 text-sm font-semibold text-ink-900">Fotos asignadas</p>
              <ul className="max-h-[32rem] divide-y divide-ink-50 overflow-y-auto">
                {matched.map((i) => (
                  <li key={i.fileName} className="flex items-center gap-3 px-5 py-2 text-sm">
                    <img src={i.url} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg border border-ink-100 bg-white object-contain" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-900">{i.productName}</p>
                      <p className="truncate text-xs text-ink-500">
                        {i.fileName}
                        {i.replacesImage && i.upload !== "done" && " · reemplaza la foto actual"}
                      </p>
                      {i.upload === "error" && <p className="text-xs text-danger-700">{i.message}</p>}
                    </div>
                    <span className="shrink-0 text-xs font-semibold">
                      {i.upload === "uploading" && <Spinner className="h-4 w-4 text-brand-600" />}
                      {i.upload === "done" && <span className="text-brand-600">Subida</span>}
                      {i.upload === "error" && <span className="text-danger-700">Error</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
          </>
        )}
      </div>
    </div>
  );
}
