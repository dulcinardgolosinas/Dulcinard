import { useRef, useState } from "react";
import { Button } from "./Button";

// El <input type="file"> nativo muestra el label del botón y el resumen de
// archivos en el idioma del sistema operativo/navegador (ej: "Choose Files",
// "No file chosen"), sin forma de traducirlo por CSS. Lo ocultamos y lo
// manejamos con un botón + texto propios, en español.
export function FileInput({ multiple = false, onChange, accept = "image/*", label, buttonLabel }) {
  const inputRef = useRef(null);
  const [summary, setSummary] = useState("Ningún archivo seleccionado");

  function handleChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) setSummary("Ningún archivo seleccionado");
    else if (files.length === 1) setSummary(files[0].name);
    else setSummary(`${files.length} archivos seleccionados`);
    onChange?.(e);
  }

  return (
    <div>
      {label && <p className="mb-1.5 text-sm font-medium text-ink-700">{label}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          {buttonLabel || (multiple ? "Elegir imágenes" : "Elegir imagen")}
        </Button>
        <span className="text-sm text-ink-500">{summary}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
