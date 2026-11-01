import { api } from "./api";

/**
 * Descarga un archivo que genera el backend (ej: un Excel) con la sesión del
 * admin. Si el servidor responde con error, lanza un Error con su mensaje.
 */
export async function downloadFromApi(path, { params, fallbackName = "archivo.xlsx" } = {}) {
  let response;
  try {
    response = await api.get(path, { params, responseType: "blob" });
  } catch (err) {
    // Con responseType "blob" el mensaje de error del backend llega como Blob.
    let message = "No pudimos descargar el archivo";
    try {
      const data = JSON.parse(await err.response.data.text());
      if (data?.message) message = data.message;
    } catch {
      // sin mensaje legible: se usa el genérico
    }
    throw new Error(message);
  }

  const disposition = response.headers["content-disposition"] || "";
  const fileName = disposition.match(/filename="?([^"]+)"?/)?.[1] || fallbackName;
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}
