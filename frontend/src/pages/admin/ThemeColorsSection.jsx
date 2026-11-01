import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Plus } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { confirmAction, toastSuccess, toastError } from "../../lib/alerts";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { DEFAULT_THEME, applyTheme, isHexColor, themeContrastChecks } from "../../lib/theme";

// Colores de la marca para elegir. "" = el rojo original de Dulcinard. Con "Otro" se agrega cualquier color.
const OPTIONS = [
  { value: "", color: DEFAULT_THEME.primary, label: "Rojo original" },
  { value: "#dd001c", color: "#dd001c", label: "Rojo vivo" },
  { value: "#8a1028", color: "#8a1028", label: "Bordó" }
];

const same = (a, b) => (a || "").toLowerCase() === (b || "").toLowerCase();

// Color de la marca (menú, botones, precios y pie de página). Al tocar uno se
// ve en el panel; se aplica a la tienda al guardar.
export function ThemeColorsSection({ config, onSaved }) {
  const setGlobalConfig = useSiteConfigStore((s) => s.setConfig);
  const savedRef = useRef(same(config?.theme?.primary, DEFAULT_THEME.primary) ? "" : config?.theme?.primary || "");
  const [color, setColor] = useState(savedRef.current);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    applyTheme({ ...(config?.theme || {}), primary: color });
  }, [color, config?.theme]);

  // Al salir sin guardar, vuelve el color guardado.
  useEffect(() => () => applyTheme({ ...(config?.theme || {}), primary: savedRef.current }), [config?.theme]);

  const isPreset = OPTIONS.some((o) => same(o.value, color));
  const readable = themeContrastChecks({ primary: color || DEFAULT_THEME.primary })[0].ok;

  async function handleSave() {
    const confirmed = await confirmAction({
      title: "¿Guardar este color?",
      text: readable ? "Se cambia en toda la tienda." : "Es un color muy claro: los textos blancos se van a leer mal. ¿Guardarlo igual?",
      confirmText: "Sí, guardar",
      icon: readable ? "question" : "warning"
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      const { data } = await api.put("/site-config", { theme: { primary: color } });
      savedRef.current = color;
      setGlobalConfig(data);
      onSaved?.(data);
      toastSuccess("Color guardado");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos guardar el color"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
      <p className="text-sm font-semibold text-ink-900">Color de la marca</p>
      <p className="mt-1 text-xs text-ink-500">Tocá un color y guardalo.</p>

      <div className="mt-4 flex flex-wrap gap-4">
        {OPTIONS.map((option) => {
          const active = same(color, option.value);
          return (
            <button key={option.label} type="button" onClick={() => setColor(option.value)} className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-white ring-offset-2 transition ${active ? "ring-2 ring-ink-900" : ""}`}
                style={{ backgroundColor: option.color }}
              >
                {active && <Check className="h-5 w-5" strokeWidth={3} />}
              </span>
              <span className={`text-xs ${active ? "font-semibold text-ink-900" : "text-ink-500"}`}>{option.label}</span>
            </button>
          );
        })}

        {/* Cualquier otro color, con la paleta del navegador. */}
        <label className="flex cursor-pointer flex-col items-center gap-1.5">
          <span
            className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-offset-2 ${
              isPreset ? "border-2 border-dashed border-ink-300 text-ink-500" : "text-white ring-2 ring-ink-900"
            }`}
            style={isPreset ? undefined : { backgroundColor: color }}
          >
            {isPreset ? <Plus className="h-5 w-5" /> : <Check className="h-5 w-5" strokeWidth={3} />}
            <input
              type="color"
              value={isHexColor(color) ? color : DEFAULT_THEME.primary}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Elegir otro color"
            />
          </span>
          <span className={`text-xs ${isPreset ? "text-ink-500" : "font-semibold text-ink-900"}`}>Agregar color</span>
        </label>
      </div>

      {!readable && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-ink-50 px-3 py-2 text-xs font-medium text-ink-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Es un color muy claro: los textos blancos de los botones se van a leer mal. Mejor uno más oscuro.
        </p>
      )}

      <Button type="button" className="mt-5" onClick={handleSave} disabled={same(color, savedRef.current) || saving}>
        {saving ? <Spinner className="h-4 w-4" /> : "Guardar"}
      </Button>
    </div>
  );
}
