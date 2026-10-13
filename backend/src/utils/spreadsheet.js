import * as XLSX from "xlsx";
import { readPdfRecords } from "./pdfPriceList.js";

// Lectura de listas de precios (Excel, LibreOffice, CSV o PDF) para la
// actualización masiva de precios (controllers/priceUpdateController.js).

/** "Precio unitario" -> "precio_unitario", "Código" -> "codigo" */
export function normalizeHeader(header) {
  return String(header ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// Excel en configuración regional de Argentina exporta CSV con ";" en vez de
// ",": se detecta el separador mirando la primera línea.
function detectDelimiter(firstLine) {
  const count = (ch) => firstLine.split(ch).length - 1;
  // Empate (ej: "PIÑATA;5.100,00"): gana ";", que es lo que exporta Excel en español.
  return count(";") > 0 && count(";") >= count(",") ? ";" : ",";
}

// Parser CSV mínimo (RFC 4180): comillas dobles, "" escapado y saltos de
// línea dentro de campos entre comillas. Todo queda como texto: así un código
// "0012" no pierde los ceros.
function parseCsvText(text) {
  const delimiter = detectDelimiter(text.split(/\r?\n/, 1)[0] || "");
  const records = [];
  let record = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      record.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || record.length) {
    record.push(field);
    records.push(record);
  }
  return records;
}

// .xlsx, .xls (Excel viejo) y .ods: los lee SheetJS. Se usa la primera hoja.
function readWorkbookRecords(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false, dense: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  // raw: true devuelve los números como números (precios con formato "$" incluidos).
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "", blankrows: true });
}

// Excel en Windows suele guardar el CSV en Windows-1252 (no UTF-8): sin esto
// las Ñ y los acentos llegan rotos ("PIÃ‘ATA").
function decodeText(buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

/**
 * Filas crudas de la primera hoja (o del PDF de una lista de precios): array de arrays, en el orden del archivo
 * (la fila i corresponde a la fila i + 1 de Excel).
 * @param {Express.Multer.File} file
 */
export async function readRecords(file) {
  if (/\.pdf$/i.test(file.originalname) || file.mimetype === "application/pdf") return readPdfRecords(file.buffer);
  const isCsv = /\.csv$/i.test(file.originalname) || file.mimetype === "text/csv";
  if (isCsv) return parseCsvText(decodeText(file.buffer).replace(/^﻿/, ""));
  return readWorkbookRecords(file.buffer);
}

/**
 * Convierte un precio o número de una planilla a Number. Acepta números de
 * Excel y textos como "3200", "$ 1,428.37" (formato EE.UU.), "1.428,37"
 * (formato argentino), "1.500" o "1,500" (miles). Devuelve NaN si no es un número.
 */
export function parseAmount(value) {
  if (typeof value === "number") return value;
  let text = String(value ?? "").replace(/[$\s ]|ARS/gi, "");
  if (!text) return NaN;
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    // Hay los dos: el que aparece último es el separador decimal.
    text = lastComma > lastDot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else {
    const sep = lastComma !== -1 ? "," : lastDot !== -1 ? "." : null;
    if (sep) {
      const parts = text.split(sep);
      // "1.500" / "1,500" / "1.234.567": separador de miles. "1,5" / "414.99": decimal.
      const thousands = parts.length > 2 || parts[parts.length - 1].length === 3;
      text = thousands ? parts.join("") : parts.join(".");
    }
  }
  if (!/^-?\d+(\.\d+)?$/.test(text)) return NaN;
  return Number(text);
}
