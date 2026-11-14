import { useEffect, useState } from "react";
import { cldUrl } from "./cloudinary";

// ¿La foto tiene fondo blanco (o transparente)? Se miran los bordes de una
// versión chiquita de la foto:
//   - fondo blanco -> se muestra entera ("contain"), como una foto de producto;
//   - otro fondo (ej: una foto de ambiente) -> ocupa todo el recuadro ("cover").
// El resultado se recuerda para no volver a calcularlo.

const cache = new Map();
const SAMPLE = 32;

function isLight(r, g, b, a) {
  return a < 20 || (r > 232 && g > 232 && b > 232);
}

function detect(url) {
  if (cache.has(url)) return cache.get(url);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE;
        canvas.height = SAMPLE;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
        const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);
        let border = 0;
        let light = 0;
        for (let y = 0; y < SAMPLE; y++) {
          for (let x = 0; x < SAMPLE; x++) {
            if (x > 1 && x < SAMPLE - 2 && y > 1 && y < SAMPLE - 2) continue; // solo el borde
            const i = (y * SAMPLE + x) * 4;
            border++;
            if (isLight(data[i], data[i + 1], data[i + 2], data[i + 3])) light++;
          }
        }
        // Si casi todo el borde es blanco, es fondo blanco.
        resolve(light / border > 0.85 ? "contain" : "cover");
      } catch {
        resolve("contain"); // sin poder leer la foto, se muestra entera
      }
    };
    img.onerror = () => resolve("contain");
    img.src = cldUrl(url, { width: 64 });
  });
  cache.set(url, promise);
  return promise;
}

/** "contain" (foto entera) o "cover" (ocupa todo el recuadro) según el fondo de la foto. */
export function useImageFit(url) {
  const [fit, setFit] = useState("contain");
  useEffect(() => {
    if (!url) return;
    let active = true;
    detect(url).then((result) => active && setFit(result));
    return () => {
      active = false;
    };
  }, [url]);
  return fit;
}
