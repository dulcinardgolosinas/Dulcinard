// Paleta editable desde el panel admin (SiteConfig.theme).
//
// Los colores por defecto viven en index.css (@theme). Cuando el admin elige
// un color, acá se genera la escala completa (50…950) a partir de ese color
// base y se pisa la variable CSS correspondiente en :root. Como todas las
// clases de Tailwind (bg-brand-600, text-ink-900, ...) leen esas variables, el
// cambio se ve en todo el sitio sin recompilar. Un color vacío = valor por defecto.

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Valores por defecto (los mismos de index.css), para los selectores del admin.
export const DEFAULT_THEME = {
  primary: "#b81830", // brand-600
  secondary: "#6b615d", // ink-500
  background: "#f6f5f5", // ink-50
  text: "#201c1b" // ink-900
};

export const THEME_FIELDS = [
  { key: "primary", label: "Rojo de la marca", help: "El único rojo del sitio: menú, botones, links, precios y pie de página" },
  { key: "secondary", label: "Secundario", help: "Textos secundarios, bordes y fondos neutros" },
  { key: "background", label: "Fondo", help: "Fondo general de las páginas" },
  { key: "text", label: "Texto", help: "Texto principal y títulos" }
];

// Qué escala genera cada color y en qué paso queda el color elegido.
const SCALES = {
  primary: { prefix: "brand", baseStep: 600 },
  secondary: { prefix: "ink", baseStep: 500 }
};

// Variables que pisan el fondo y el texto (por encima de la escala secundaria).
const SINGLE_VARS = {
  background: ["--color-ink-50"],
  text: ["--color-ink-900"]
};

const STORAGE_KEY = "dulcinard-theme";

export const isHexColor = (value) => /^#[0-9a-fA-F]{6}$/.test(value || "");

function hexToRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function rgbToHex(rgb) {
  return `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

function mix(rgb, target, amount) {
  return rgb.map((v, i) => v + (target[i] - v) * amount);
}

/**
 * Escala 50…950 a partir de un color base: los pasos más claros se mezclan
 * con blanco y los más oscuros con negro. El paso base queda exactamente igual.
 * @returns {Record<number, string>}
 */
export function buildScale(hex, baseStep = 600) {
  const rgb = hexToRgb(hex);
  const baseIndex = STEPS.indexOf(baseStep);
  const lastIndex = STEPS.length - 1;
  return Object.fromEntries(
    STEPS.map((step, i) => {
      if (i === baseIndex) return [step, hex.toLowerCase()];
      if (i < baseIndex) return [step, rgbToHex(mix(rgb, [255, 255, 255], (0.95 * (baseIndex - i)) / baseIndex))];
      return [step, rgbToHex(mix(rgb, [0, 0, 0], (0.75 * (i - baseIndex)) / (lastIndex - baseIndex)))];
    })
  );
}

/** Variables CSS que resultan de un theme (solo las de colores elegidos). */
export function themeToCssVars(theme = {}) {
  const vars = {};
  for (const [key, { prefix, baseStep }] of Object.entries(SCALES)) {
    if (!isHexColor(theme[key])) continue;
    for (const [step, color] of Object.entries(buildScale(theme[key], baseStep))) vars[`--color-${prefix}-${step}`] = color;
  }
  for (const [key, names] of Object.entries(SINGLE_VARS)) {
    if (isHexColor(theme[key])) names.forEach((name) => (vars[name] = theme[key].toLowerCase()));
  }
  return vars;
}

const ALL_VARS = [
  ...Object.values(SCALES).flatMap(({ prefix }) => STEPS.map((step) => `--color-${prefix}-${step}`)),
  ...Object.values(SINGLE_VARS).flat()
];

/** Aplica el theme en todo el sitio (y lo recuerda para la próxima carga, sin parpadeo). */
export function applyTheme(theme) {
  const root = document.documentElement;
  ALL_VARS.forEach((name) => root.style.removeProperty(name));
  const vars = themeToCssVars(theme);
  Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
  try {
    if (Object.keys(vars).length) localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sin localStorage (modo privado) solo se pierde el aplicado instantáneo
  }
}

/** Aplica el último theme conocido antes de que llegue la configuración del servidor. */
export function applyCachedTheme() {
  try {
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (cached) applyTheme(cached);
  } catch {
    // ignorar caché corrupta
  }
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relación de contraste WCAG entre dos colores hex (1 a 21). */
export function contrastRatio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Pares de colores que usa el sitio, para avisar en el admin si alguno no
 * llega al mínimo de legibilidad (WCAG AA: 4.5 para texto normal).
 */
export function themeContrastChecks(theme) {
  const t = Object.fromEntries(Object.entries(DEFAULT_THEME).map(([k, v]) => [k, isHexColor(theme[k]) ? theme[k] : v]));
  return [
    { label: "Botones primarios (texto blanco) y links sobre blanco", ratio: contrastRatio("#ffffff", t.primary) },
    { label: "Texto principal sobre el fondo", ratio: contrastRatio(t.text, t.background) },
    { label: "Texto principal sobre tarjetas blancas", ratio: contrastRatio(t.text, "#ffffff") },
    { label: "Texto secundario sobre el fondo", ratio: contrastRatio(t.secondary, t.background) }
  ].map((check) => ({ ...check, ok: check.ratio >= 4.5 }));
}
