import * as XLSX from "xlsx";

// Armado de planillas .xlsx para descargar desde el panel (pedidos entregados,
// stock). Se usa la misma librería que lee las listas de precios.

const MONEY_FORMAT = '"$"#,##0.00';
const INT_FORMAT = "#,##0";

/**
 * @param {Array<{ name: string, columns: Array<{ header: string, width?: number, format?: "money" | "int" }>, rows: any[][] }>} sheets
 * @returns {Buffer}
 */
export function buildWorkbook(sheets) {
  const workbook = XLSX.utils.book_new();
  for (const { name, columns, rows } of sheets) {
    const sheet = XLSX.utils.aoa_to_sheet([columns.map((c) => c.header), ...rows]);
    sheet["!cols"] = columns.map((c) => ({ wch: c.width || Math.max(10, c.header.length + 2) }));
    // Encabezado fijo al bajar y filtros en cada columna.
    sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: columns.length - 1 } }) };
    columns.forEach((column, c) => {
      const format = column.format === "money" ? MONEY_FORMAT : column.format === "int" ? INT_FORMAT : null;
      if (!format) return;
      for (let r = 1; r <= rows.length; r++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        if (cell && cell.t === "n") cell.z = format;
      }
    });
    XLSX.utils.book_append_sheet(workbook, sheet, name.slice(0, 31));
  }
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/** Fecha y hora de Argentina como texto ("14/10/2026 18:30"), sin depender del huso del servidor. */
export function formatArDate(date, { withTime = true } = {}) {
  if (!date) return "";
  return new Date(date).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {})
  }).replace(",", "");
}

export function sendWorkbook(res, buffer, fileName) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.send(buffer);
}
