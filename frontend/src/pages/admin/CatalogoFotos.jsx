import { useEffect, useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { confirmAction, toastSuccess, toastError } from "../../lib/alerts";
import { extractCatalogPhotos } from "../../lib/catalogPdf";

const CONCURRENCY = 5;
const SUGGEST_BATCH = 150; // fotos por pedido de sugerencias (límite de tamaño del body)

// Fotos de un catálogo PDF: se recortan en el navegador, se sugiere el producto
// de cada una según el texto que tiene cerca y el admin revisa/corrige antes de guardar.
export function CatalogoFotos() {
  const inputRef = useRef(null);
  const [step, setStep] = useState("idle"); // idle | reading | review | uploading
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [photos, setPhotos] = useState([]); // { id, page, url, blob, texts, productId, score, include, upload, message }
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("all"); // all | review
  const [ignored, setIgnored] = useState(0);

  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const productsById = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);
  const productsByName = useMemo(() => new Map(products.map((p) => [p.name.toLowerCase(), p])), [products]);

  async function handleFile(file) {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name)) return toastError("Elegí el catálogo en PDF");
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setStep("reading");
    try {
      const [{ data: options }, extracted] = await Promise.all([
        api.get("/products/images/options"),
        extractCatalogPhotos(file, ({ page, pages }) => setProgress({ done: page, total: pages }))
      ]);
      setProducts(options);
      if (!extracted.length) {
        setStep("idle");
        return toastError("No encontramos fotos separadas en el PDF. Si cada página es una sola imagen, usá la subida de fotos sueltas.");
      }

      const suggestions = [];
      for (let i = 0; i < extracted.length; i += SUGGEST_BATCH) {
        const batch = extracted.slice(i, i + SUGGEST_BATCH);
        const { data } = await api.post("/products/images/suggest", { photos: batch.map((p) => ({ texts: p.texts })) });
        suggestions.push(...data.suggestions);
      }

      // Solo interesan las fotos de productos ya cargados: las que no coinciden
      // con ninguno se descartan, y si varias coinciden con el mismo producto
      // se queda la que mejor coincide.
      const bestByProduct = new Map();
      extracted.forEach((p, i) => {
        const s = suggestions[i];
        if (!s?.productId) return;
        const current = bestByProduct.get(s.productId);
        if (!current || s.score > current.score) bestByProduct.set(s.productId, { photo: p, ...s });
      });
      const kept = [...bestByProduct.values()].sort((a, b) => a.photo.page - b.photo.page || a.photo.id.localeCompare(b.photo.id));
      setIgnored(extracted.length - kept.length);

      if (!kept.length) {
        setStep("idle");
        return toastError("Ninguna foto del catálogo coincide con los productos cargados. Revisá que los nombres sean parecidos.");
      }
      setPhotos(
        kept.map(({ photo, productId, score }) => ({
          ...photo,
          url: URL.createObjectURL(photo.blob),
          productId,
          score,
          include: true,
          upload: null,
          message: ""
        }))
      );
      setStep("review");
    } catch (err) {
      setStep("idle");
      toastError(apiErrorMessage(err, "No pudimos leer el catálogo"));
    }
  }

  function updatePhoto(id, patch) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function chooseProduct(photo, value) {
    const product = productsByName.get(value.trim().toLowerCase());
    updatePhoto(photo.id, { productId: product?._id || "", include: Boolean(product), score: product ? 1 : 0, typed: value });
  }

  // Dos fotos marcadas para el mismo producto: solo se sube la primera.
  const duplicateIds = useMemo(() => {
    const seen = new Set();
    const dup = new Set();
    for (const p of photos) {
      if (!p.include || !p.productId) continue;
      if (seen.has(p.productId)) dup.add(p.id);
      seen.add(p.productId);
    }
    return dup;
  }, [photos]);

  const toUpload = photos.filter((p) => p.include && p.productId && !duplicateIds.has(p.id) && p.upload !== "done");
  const needsReview = (p) => !p.productId || p.score < 0.75 || duplicateIds.has(p.id);
  const visible = photos.filter((p) => (filter === "review" ? needsReview(p) : true));

  async function uploadAll() {
    const replacing = toUpload.filter((p) => productsById.get(p.productId)?.hasImage).length;
    const confirmed = await confirmAction({
      title: `¿Guardar ${toUpload.length} foto(s)?`,
      text: replacing
        ? `${replacing} producto(s) ya tienen foto: se reemplaza por la del catálogo.`
        : "Cada foto queda como la principal de su producto.",
      confirmText: "Sí, guardar",
      icon: "question"
    });
    if (!confirmed) return;

    setStep("uploading");
    setProgress({ done: 0, total: toUpload.length });
    const queue = [...toUpload];
    let failed = 0;
    async function worker() {
      while (queue.length) {
        const photo = queue.shift();
        updatePhoto(photo.id, { upload: "uploading", message: "" });
        try {
          const formData = new FormData();
          formData.append("image", new File([photo.blob], `catalogo-${photo.id}.jpg`, { type: "image/jpeg" }));
          await api.put(`/products/${photo.productId}/main-image`, formData, { headers: { "Content-Type": "multipart/form-data" } });
          updatePhoto(photo.id, { upload: "done" });
        } catch (err) {
          failed++;
          updatePhoto(photo.id, { upload: "error", message: apiErrorMessage(err, "No se pudo subir") });
        } finally {
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setStep("review");
    if (failed) toastError(`${failed} foto(s) no se pudieron subir: podés reintentar`);
    else toastSuccess("Fotos guardadas en sus productos");
  }

  function reset() {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setIgnored(0);
    setStep("idle");
  }

  const assigned = photos.filter((p) => p.productId).length;

  return (
    <div>
      <div className="rounded-2xl border border-ink-100 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <FileText className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">Subí el catálogo en PDF</p>
            <p className="mt-0.5 text-sm text-ink-600">
              Se toman solo las fotos de los productos que ya cargaste: cada una se asigna al producto cuyo nombre aparece al lado
              o debajo, y se guarda completa, tal como viene en el catálogo. Antes de guardar revisás cada foto y
              corregís las que no coincidan.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={step === "reading" || step === "uploading"}>
            Elegir catálogo PDF
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {step === "reading" && (
            <span className="flex items-center gap-2 text-sm text-ink-500">
              <Spinner className="h-4 w-4" />
              {progress.total ? `Leyendo página ${progress.done} de ${progress.total}...` : "Abriendo el catálogo..."}
            </span>
          )}
        </div>
      </div>

      {photos.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-700">
              <b>{assigned}</b> producto(s) cargados tienen foto en el catálogo
              {ignored > 0 && (
                <span className="text-ink-500">
                  {" "}
                  · {ignored} imagen(es) del catálogo no corresponden a ningún producto cargado y se ignoran
                </span>
              )}
            </p>
            <div className="flex gap-1 rounded-full bg-ink-100 p-1 text-xs font-semibold">
              {[
                ["all", "Todas"],
                ["review", "Para revisar"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-3 py-1.5 ${filter === value ? "bg-white text-brand-600 shadow-sm" : "text-ink-600"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {step === "uploading" && (
            <div className="mt-4">
              <p className="text-sm text-ink-700">
                Guardando {progress.done} de {progress.total}...
              </p>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
                <div className="h-full bg-brand-600 transition-all" style={{ width: `${(progress.done / (progress.total || 1)) * 100}%` }} />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={uploadAll} disabled={step !== "review" || !toUpload.length}>
              {step === "uploading" ? <Spinner className="h-4 w-4" /> : toUpload.length ? `Guardar ${toUpload.length} foto(s)` : "Nada para guardar"}
            </Button>
            <Button variant="ghost" onClick={reset} disabled={step === "uploading"}>
              Empezar de nuevo
            </Button>
          </div>

          <datalist id="catalog-products">
            {products.map((p) => (
              <option key={p._id} value={p.name} />
            ))}
          </datalist>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((photo) => {
              const product = productsById.get(photo.productId);
              const dup = duplicateIds.has(photo.id);
              const border = photo.upload === "done" ? "border-brand-300" : !photo.productId || dup ? "border-danger-200" : photo.score < 0.75 ? "border-brand-300" : "border-ink-100";
              return (
                <div key={photo.id} className={`flex flex-col rounded-2xl border bg-white p-3 ${border}`}>
                  <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-xl bg-ink-50">
                    <img src={photo.url} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                      Pág. {photo.page}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] text-ink-500" title={photo.texts.join(" | ")}>
                    Texto cercano: {photo.texts[0] || "—"}
                  </p>
                  <input
                    list="catalog-products"
                    value={photo.typed ?? product?.name ?? ""}
                    onChange={(e) => chooseProduct(photo, e.target.value)}
                    placeholder="Escribí el producto..."
                    disabled={photo.upload === "done" || step === "uploading"}
                    className="mt-2 w-full rounded-xl border border-ink-200 px-3 py-2 text-xs outline-none focus:border-brand-500"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <label className="flex items-center gap-1.5 text-ink-700">
                      <input
                        type="checkbox"
                        checked={photo.include && Boolean(photo.productId)}
                        disabled={!photo.productId || photo.upload === "done" || step === "uploading"}
                        onChange={(e) => updatePhoto(photo.id, { include: e.target.checked })}
                        className="h-3.5 w-3.5 accent-brand-600"
                      />
                      Guardar
                    </label>
                    <span className="text-right font-semibold">
                      {photo.upload === "done" && <span className="text-brand-600">Guardada</span>}
                      {photo.upload === "uploading" && <Spinner className="h-3.5 w-3.5 text-brand-600" />}
                      {photo.upload === "error" && <span className="text-danger-700">{photo.message}</span>}
                      {!photo.upload && dup && <span className="text-danger-700">Otra foto ya va a este producto</span>}
                      {!photo.upload && !dup && !photo.productId && <span className="text-danger-700">Sin producto</span>}
                      {!photo.upload && !dup && photo.productId && photo.score < 0.75 && <span className="text-brand-600">Revisar</span>}
                      {!photo.upload && !dup && photo.productId && photo.score >= 0.75 && product?.hasImage && (
                        <span className="text-ink-500">Reemplaza la actual</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
