import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { confirmAction, toastSuccess, toastError } from "../../lib/alerts";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { DEFAULT_THEME, THEME_FIELDS, applyTheme, isHexColor, themeContrastChecks } from "../../lib/theme";

const EMPTY_THEME = Object.fromEntries(THEME_FIELDS.map(({ key }) => [key, ""]));

function normalizeTheme(theme) {
  return { ...EMPTY_THEME, ...Object.fromEntries(Object.entries(theme || {}).filter(([k]) => k in EMPTY_THEME)) };
}

// Paleta del sitio editable desde el admin. Los cambios se ven en vivo en todo
// el panel; si se sale sin guardar, se vuelve a la paleta guardada.
export function ThemeColorsSection({ config, onSaved }) {
  const setGlobalConfig = useSiteConfigStore((s) => s.setConfig);
  const [draft, setDraft] = useState(() => normalizeTheme(config?.theme));
  const [saving, setSaving] = useState(false);
  const savedThemeRef = useRef(normalizeTheme(config?.theme));

  useEffect(() => {
    applyTheme(draft);
  }, [draft]);

  // Al salir de la página sin guardar, se restaura la paleta guardada.
  useEffect(() => () => applyTheme(savedThemeRef.current), []);

  const dirty = THEME_FIELDS.some(({ key }) => draft[key] !== savedThemeRef.current[key]);
  const checks = themeContrastChecks(draft);
  const failing = checks.filter((c) => !c.ok);

  function setColor(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function save(theme) {
    setSaving(true);
    try {
      const { data } = await api.put("/site-config", { theme });
      savedThemeRef.current = normalizeTheme(data.theme);
      setDraft(savedThemeRef.current);
      setGlobalConfig(data);
      onSaved?.(data);
      toastSuccess("Colores actualizados");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos guardar los colores"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (THEME_FIELDS.some(({ key }) => draft[key] && !isHexColor(draft[key]))) {
      return toastError("Revisá los colores: deben tener el formato #rrggbb");
    }
    if (failing.length) {
      const confirmed = await confirmAction({
        title: "Hay combinaciones poco legibles",
        text: `${failing.length} combinación(es) no llegan al contraste mínimo recomendado. ¿Guardar igual?`,
        confirmText: "Sí, guardar",
        icon: "warning"
      });
      if (!confirmed) return;
    }
    save(draft);
  }

  async function handleReset() {
    const confirmed = await confirmAction({
      title: "¿Restaurar colores originales?",
      text: "El sitio vuelve a la paleta original de Dulcinard.",
      confirmText: "Sí, restaurar",
      icon: "question"
    });
    if (confirmed) save(EMPTY_THEME);
  }

  return (
    <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
      <p className="text-sm font-semibold text-ink-900">Colores del sitio</p>
      <p className="mt-1 text-xs text-ink-500">
        Los cambios se ven en vivo en el panel. Se aplican a toda la tienda recién cuando guardás.
      </p>

      <div className="mt-4 space-y-3">
        {THEME_FIELDS.map(({ key, label, help }) => {
          const value = draft[key] || DEFAULT_THEME[key];
          const custom = Boolean(draft[key]);
          return (
            <div key={key} className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={isHexColor(value) ? value : DEFAULT_THEME[key]}
                onChange={(e) => setColor(key, e.target.value)}
                aria-label={`Color ${label.toLowerCase()}`}
                className="h-10 w-12 cursor-pointer rounded-lg border border-ink-200 bg-white p-1"
              />
              <div className="min-w-40 flex-1">
                <p className="text-sm font-medium text-ink-800">
                  {label} {!custom && <span className="text-xs font-normal text-ink-500">(original)</span>}
                </p>
                <p className="text-xs text-ink-500">{help}</p>
              </div>
              <input
                value={draft[key]}
                onChange={(e) => setColor(key, e.target.value.trim())}
                placeholder={DEFAULT_THEME[key]}
                aria-label={`Código del color ${label.toLowerCase()}`}
                className={`w-28 rounded-xl border px-3 py-2 font-mono text-sm outline-none ${
                  draft[key] && !isHexColor(draft[key]) ? "border-danger-400" : "border-ink-200 focus:border-brand-500"
                }`}
              />
              {custom && (
                <button
                  type="button"
                  onClick={() => setColor(key, "")}
                  className="text-xs font-semibold text-ink-500 hover:text-brand-600"
                >
                  Original
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl bg-ink-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Vista previa</p>
        <p className="font-display text-lg font-bold text-ink-900">Título de ejemplo</p>
        <p className="text-sm text-ink-500">Texto secundario de ejemplo con un <span className="font-semibold text-brand-600">link</span>.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm">Botón primario</Button>
          <Button size="sm" variant="accent">
            Botón acento
          </Button>
          <Button size="sm" variant="outline">
            Secundario
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Legibilidad (contraste mínimo 4.5)</p>
        <ul className="space-y-1">
          {checks.map((check) => (
            <li key={check.label} className={`flex items-center gap-2 text-xs ${check.ok ? "text-ink-600" : "font-semibold text-danger-700"}`}>
              {check.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              )}
              {check.label}: {check.ratio.toFixed(1)}
              {!check.ok && " — poco legible"}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" onClick={handleSave} disabled={!dirty || saving}>
          {saving ? <Spinner className="h-4 w-4" /> : "Guardar colores"}
        </Button>
        {dirty && (
          <Button type="button" variant="ghost" onClick={() => setDraft(savedThemeRef.current)} disabled={saving}>
            Descartar cambios
          </Button>
        )}
        {THEME_FIELDS.some(({ key }) => savedThemeRef.current[key]) && (
          <Button type="button" variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Restaurar originales
          </Button>
        )}
      </div>
    </div>
  );
}
