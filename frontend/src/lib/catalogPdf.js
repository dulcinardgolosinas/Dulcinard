// Extracción de fotos de un catálogo PDF, en el navegador.
//
// Para cada página:
//   1. Se recorre la lista de operaciones de dibujo del PDF siguiendo la matriz
//      de transformación, para saber dónde y de qué tamaño se dibuja cada foto.
//   2. Se renderiza la página y se recorta cada foto de ese render (así sirve
//      cualquier formato de imagen que use el PDF).
//   3. Se juntan los renglones de texto cercanos a cada foto (debajo, al lado,
//      arriba), que normalmente son el nombre del producto.
// pdf.js se carga recién al usarlo, para no agrandar el resto del panel.

const RENDER_SCALE = 3; // calidad del recorte
const MIN_SIDE = 90; // px de render (escala 3): menos que esto son íconos o logos chicos
const MAX_PAGE_FRACTION = 0.85; // fotos que ocupan casi toda la página = fondo
const PRICE_ONLY = /^\$?\s*[\d.,]+\s*$/;

let pdfjsPromise;
async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url")
    ]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/** Rectángulos (en px del render) donde se dibuja cada imagen de la página. */
export function imageBoxes(pdfjs, operatorList, viewport) {
  const { OPS, Util } = pdfjs;
  const boxes = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];

  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const fn = operatorList.fnArray[i];
    const args = operatorList.argsArray[i];
    if (fn === OPS.save) stack.push(ctm);
    else if (fn === OPS.restore) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (fn === OPS.transform) ctm = Util.transform(ctm, args);
    else if (fn === OPS.paintFormXObjectBegin) {
      stack.push(ctm);
      if (Array.isArray(args?.[0]) && args[0].length === 6) ctm = Util.transform(ctm, args[0]);
    } else if (fn === OPS.paintFormXObjectEnd) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageXObjectRepeat) {
      // La imagen se dibuja en el cuadrado unitario transformado por la matriz actual.
      const corners = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1]
      ].map((p) => viewport.convertToViewportPoint(...Util.applyTransform(p, ctm)));
      const xs = corners.map((c) => c[0]);
      const ys = corners.map((c) => c[1]);
      boxes.push({
        objId: typeof args?.[0] === "string" ? args[0] : null,
        left: Math.max(0, Math.min(...xs)),
        top: Math.max(0, Math.min(...ys)),
        right: Math.min(viewport.width, Math.max(...xs)),
        bottom: Math.min(viewport.height, Math.max(...ys)),
        // Imagen derecha (sin rotar ni espejar): se puede usar tal cual viene en el PDF.
        upright: Math.abs(ctm[1]) < 1e-6 && Math.abs(ctm[2]) < 1e-6 && ctm[0] > 0 && ctm[3] > 0
      });
    }
  }
  return boxes;
}

/** Renglones de texto de la página con su posición (px del render). */
export function textLines(textContent, viewport) {
  const parts = [];
  for (const item of textContent.items) {
    const text = item.str?.trim();
    if (!text) continue;
    const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
    const height = Math.abs(item.transform[3] || item.height || 10) * viewport.scale;
    parts.push({ text, left: x, right: x + item.width * viewport.scale, bottom: y, top: y - height });
  }
  // Fragmentos a la misma altura y cerca entre sí forman un renglón.
  parts.sort((a, b) => a.top - b.top || a.left - b.left);
  const lines = [];
  for (const part of parts) {
    const line = lines.find(
      (l) => Math.abs(l.top - part.top) < (part.bottom - part.top) * 0.5 && part.left - l.right < 40 && part.left >= l.left - 5
    );
    if (line) {
      line.text += " " + part.text;
      line.right = Math.max(line.right, part.right);
      line.bottom = Math.max(line.bottom, part.bottom);
    } else lines.push({ ...part });
  }
  return lines.filter((l) => !PRICE_ONLY.test(l.text));
}

const overlap = (a1, a2, b1, b2) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));

/**
 * Textos candidatos para el nombre del producto de una foto, del más probable
 * al menos: debajo, a la derecha, arriba. Incluye el renglón siguiente pegado
 * (nombres que ocupan dos líneas).
 */
/**
 * Imágenes que se repiten en 3 o más páginas: el logo, encabezados o adornos,
 * no fotos de productos. Se detectan por ser la misma imagen del PDF, o por
 * estar en el mismo lugar con el mismo texto al lado en todas esas páginas
 * (una grilla de productos repite lugares, pero no textos), o por repetir lugar
 * sin tener ningún texto cerca.
 * @param {Array<Array<{objId, left, top, right, bottom, texts: string[]}>>} boxesByPage
 * @returns {(box) => boolean}
 */
export function repeatedImageFilter(boxesByPage) {
  if (boxesByPage.length < 3) return () => false;
  const place = (b) => [b.left, b.top, b.right, b.bottom].map((v) => Math.round(v / 8)).join(",");
  const placeKey = (b) => place(b) + "|" + (b.texts?.[0] || "").toLowerCase();
  const count = new Map();
  for (const boxes of boxesByPage) {
    const keys = new Set(boxes.flatMap((b) => [b.objId && `o:${b.objId}`, `p:${placeKey(b)}`, `l:${place(b)}`].filter(Boolean)));
    keys.forEach((k) => count.set(k, (count.get(k) || 0) + 1));
  }
  return (b) =>
    (b.objId && count.get(`o:${b.objId}`) >= 3) ||
    count.get(`p:${placeKey(b)}`) >= 3 ||
    // Mismo lugar en varias páginas y sin ningún texto cerca: un adorno.
    (count.get(`l:${place(b)}`) >= 3 && !b.texts?.length);
}

export function nearbyTexts(box, lines) {
  const width = box.right - box.left;
  const height = box.bottom - box.top;
  const scored = [];
  for (const line of lines) {
    const hOverlap = overlap(box.left - width * 0.2, box.right + width * 0.2, line.left, line.right);
    const vOverlap = overlap(box.top, box.bottom, line.top, line.bottom);
    const below = line.top - box.bottom;
    const above = box.top - line.bottom;
    const right = line.left - box.right;
    if (hOverlap > 0 && below >= -10 && below < height * 0.8 + 30) scored.push({ line, distance: Math.max(0, below) });
    else if (vOverlap > 0 && right >= -10 && right < width * 1.5) scored.push({ line, distance: Math.max(0, right) + 20 });
    else if (hOverlap > 0 && above >= -10 && above < height * 0.4 + 20) scored.push({ line, distance: Math.max(0, above) + 40 });
  }
  scored.sort((a, b) => a.distance - b.distance);

  const texts = [];
  for (const { line } of scored.slice(0, 3)) {
    texts.push(line.text);
    const next = lines.find(
      (l) => l !== line && l.top >= line.bottom - 2 && l.top - line.bottom < (line.bottom - line.top) * 1.2 && overlap(line.left, line.right, l.left, l.right) > 0
    );
    if (next) texts.push(`${line.text} ${next.text}`);
  }
  return [...new Set(texts)];
}

const MAX_OUTPUT_SIDE = 1600; // px: más que esto solo pesa sin verse mejor

// Guarda la foto completa, tal como viene en el catálogo (misma forma, sin
// recortar ni agregar bordes). Solo se achica si es enorme. Lo transparente
// queda en blanco, porque JPG no tiene transparencia.
function toJpeg(source, sx, sy, sw, sh) {
  const scale = Math.min(1, MAX_OUTPUT_SIDE / Math.max(sw, sh));
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(sw * scale));
  out.height = Math.max(1, Math.round(sh * scale));
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, out.width, out.height);
  return new Promise((resolve) => out.toBlob(resolve, "image/jpeg", 0.9));
}

// Recorte desde la página renderizada (plan B, más lento).
function cropFromRender(canvas, box) {
  const left = Math.max(0, Math.floor(box.left));
  const top = Math.max(0, Math.floor(box.top));
  const width = Math.min(canvas.width - left, Math.ceil(box.right - box.left));
  const height = Math.min(canvas.height - top, Math.ceil(box.bottom - box.top));
  return toJpeg(canvas, left, top, width, height);
}

// pdf.js ImageKind
const GRAYSCALE_1BPP = 1;
const RGB_24BPP = 2;
const RGBA_32BPP = 3;

/**
 * La imagen tal cual está guardada en el PDF (resolución original), sin
 * renderizar la página: es mucho más rápido. null si no se puede obtener.
 */
async function embeddedImage(page, objId) {
  if (!objId) return null;
  const store = objId.startsWith("g_") ? page.commonObjs : page.objs;
  // El worker de pdf.js manda las imágenes un instante después de la lista de
  // operaciones: se espera a que lleguen (con un tope, por si alguna nunca llega).
  const img = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 1500);
    try {
      store.get(objId, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
  if (!img?.width || !img?.height) return null;
  if (img.bitmap) return img.bitmap;
  if (!img.data) return null;

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  const out = ctx.createImageData(img.width, img.height);
  const src = img.data;
  const dst = out.data;
  const pixels = img.width * img.height;
  if (img.kind === RGBA_32BPP) dst.set(src.subarray(0, pixels * 4));
  else if (img.kind === RGB_24BPP) {
    for (let i = 0, j = 0; i < pixels; i++, j += 3) {
      dst[i * 4] = src[j];
      dst[i * 4 + 1] = src[j + 1];
      dst[i * 4 + 2] = src[j + 2];
      dst[i * 4 + 3] = 255;
    }
  } else if (img.kind === GRAYSCALE_1BPP) {
    const rowBytes = (img.width + 7) >> 3;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const v = (src[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1 ? 255 : 0;
        const i = (y * img.width + x) * 4;
        dst[i] = dst[i + 1] = dst[i + 2] = v;
        dst[i + 3] = 255;
      }
    }
  } else return null;
  ctx.putImageData(out, 0, 0);
  return canvas;
}

/**
 * @param {File} file - catálogo en PDF
 * @param {(progress: {page: number, pages: number}) => void} onProgress
 * @returns {Promise<Array<{ id: string, page: number, blob: Blob, texts: string[] }>>}
 */
export async function extractCatalogPhotos(file, onProgress) {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  const boxesByPage = [];
  const candidates = [];

  try {
    // Una sola pasada: por página se ubican las fotos y sus textos, y cada foto
    // se saca directo del PDF. Solo si alguna no se puede sacar así (rotada,
    // formato raro) se renderiza esa página para recortarla.
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      onProgress?.({ page: pageNumber, pages: doc.numPages });
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const [operatorList, textContent] = await Promise.all([page.getOperatorList(), page.getTextContent()]);
      const boxes = imageBoxes(pdfjs, operatorList, viewport).filter((b) => {
        const w = b.right - b.left;
        const h = b.bottom - b.top;
        return w >= MIN_SIDE && h >= MIN_SIDE && w * h < viewport.width * viewport.height * MAX_PAGE_FRACTION;
      });
      const lines = textLines(textContent, viewport);
      boxes.forEach((b) => (b.texts = nearbyTexts(b, lines)));
      boxesByPage.push(boxes);

      let rendered = null;
      for (const [i, box] of boxes.entries()) {
        let blob = null;
        const source = box.upright ? await embeddedImage(page, box.objId) : null;
        if (source) blob = await toJpeg(source, 0, 0, source.width, source.height);
        if (!blob) {
          if (!rendered) {
            rendered = document.createElement("canvas");
            rendered.width = Math.ceil(viewport.width);
            rendered.height = Math.ceil(viewport.height);
            await page.render({ canvasContext: rendered.getContext("2d"), viewport }).promise;
          }
          blob = await cropFromRender(rendered, box);
        }
        if (blob) candidates.push({ box, photo: { id: `${pageNumber}-${i}`, page: pageNumber, blob, texts: box.texts } });
      }
      if (rendered) rendered.width = rendered.height = 0; // libera memoria
      page.cleanup();
    }

    // Una misma imagen repetida en muchas páginas es el logo o un adorno, no un producto.
    const isRepeated = repeatedImageFilter(boxesByPage);
    return candidates.filter((c) => !isRepeated(c.box)).map((c) => c.photo);
  } finally {
    await doc.destroy();
  }
}
