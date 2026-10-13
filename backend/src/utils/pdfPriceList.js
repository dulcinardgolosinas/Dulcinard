// Lectura de listas de precios en PDF (ej: "LISTA PAGINA.pdf" del proveedor),
// donde cada renglón es "$ 1,428.37   ALF. TOFI TRIPLE X 78 GR NEGRO".
// Se extrae el texto con pdf.js (Mozilla) y se arma una tabla PRODUCTO / PRECIO
// con el mismo formato que devuelve la lectura de un Excel.

const MAX_PAGES = 300;

// pdf.js se carga recién cuando hace falta (es pesado). El worker se importa
// también: así corre en el mismo proceso, sin archivos extra en el servidor.
async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  return pdfjs;
}

/** Agrupa los fragmentos de texto de una página en renglones (misma altura). */
function pageLines(items) {
  const rows = [];
  for (const item of items) {
    const text = item.str?.trim();
    if (!text) continue;
    const [x, y] = [item.transform[4], item.transform[5]];
    let row = rows.find((r) => Math.abs(r.y - y) <= 2);
    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x, text });
  }
  return rows
    .sort((a, b) => b.y - a.y) // de arriba hacia abajo
    .map((r) =>
      r.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    );
}

// "$ 1,428.37 ALF. TOFI ..." (precio primero) o "ALF. TOFI ... $ 1,428.37" (precio al final).
const PRICE_FIRST = /^\$\s*([\d.,]+)\s+(.+)$/;
const PRICE_LAST = /^(.+?)\s+\$\s*([\d.,]+)$/;
const PRICE_FIRST_NO_SIGN = /^(\d{1,3}(?:[.,]\d{3})*[.,]\d{2}|\d+[.,]\d{2})\s+(.+)$/;

function splitLine(line) {
  let match = line.match(PRICE_FIRST) || line.match(PRICE_FIRST_NO_SIGN);
  if (match) return { price: match[1], name: match[2] };
  match = line.match(PRICE_LAST);
  if (match) return { price: match[2], name: match[1] };
  return null;
}

/**
 * Filas al estilo planilla: [["PRODUCTO", "PRECIO"], [nombre, precio], ...].
 * Los renglones sin precio (títulos, encabezados, pie de página) se ignoran.
 * @param {Buffer} buffer
 */
export async function readPdfRecords(buffer) {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    verbosity: 0, // sin avisos por fuentes no embebidas (no afectan la lectura del texto)
    disableFontFace: true,
    useSystemFonts: false
  }).promise;

  if (doc.numPages > MAX_PAGES) {
    throw Object.assign(new Error(`El PDF tiene ${doc.numPages} páginas; el máximo es ${MAX_PAGES}`), { status: 400 });
  }

  const records = [["PRODUCTO", "PRECIO"]];
  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      for (const line of pageLines(content.items)) {
        const parsed = splitLine(line);
        if (parsed) records.push([parsed.name, parsed.price]);
      }
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return records;
}
