import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bold, Eye, List } from "lucide-react";
import { api, apiErrorMessage } from "../../lib/api";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { LoadError } from "../../components/ui/LoadError";
import { RichText } from "../../components/ui/RichText";
import { confirmAction, resultAlert } from "../../lib/alerts";
import { DEFAULT_CONTENT, mergeContent } from "../../lib/siteContent";
import { useSiteConfigStore } from "../../store/siteConfigStore";

// Largo máximo de cada texto (los mismos que valida el servidor).
const LIMITS = {
  aboutIntro: 600,
  aboutStoryTitle: 120,
  aboutStory: 4000,
  aboutQuote: 300,
  aboutQuoteNote: 200,
  value1Title: 40,
  value1Text: 200,
  value2Title: 40,
  value2Text: 200,
  value3Title: 40,
  value3Text: 200,
  shippingIntro: 300,
  shippingInfo: 3000,
  contactTitle: 80,
  contactText: 600,
  contactPhone: 40,
  contactEmail: 120,
  contactHours: 600
};
const text = (max) => z.string().max(max, `Puede tener hasta ${max} caracteres`);
const schema = z.object({
  ...Object.fromEntries(Object.entries(LIMITS).map(([k, max]) => [k, text(max)])),
  contactEmail: z.union([z.literal(""), z.string().trim().email("Ese email no es válido")]),
  contactPhone: z.union([z.literal(""), z.string().trim().regex(/^[0-9+()\s-]+$/, "El teléfono solo puede tener números")]),
  whatsappNumber: z.union([z.literal(""), z.string().trim().regex(/^[0-9]{6,15}$/, "Solo números, sin espacios (ej: 3814091213)")]),
  instagram: z.union([z.literal(""), z.string().trim().url("Pegá el link completo (https://...)")]),
  facebook: z.union([z.literal(""), z.string().trim().url("Pegá el link completo (https://...)")])
});

const TABS = [
  {
    key: "about",
    label: "Quiénes somos",
    fields: [
      { name: "aboutIntro", label: "Presentación (arriba de todo)", rich: true, rows: 3 },
      { name: "aboutStoryTitle", label: "Título de la historia" },
      { name: "aboutStory", label: "Historia", rich: true, rows: 8 },
      { name: "aboutQuote", label: "Frase destacada", rows: 2 },
      { name: "aboutQuoteNote", label: "Texto debajo de la frase" },
      { name: "value1Title", label: "Valor 1: título" },
      { name: "value1Text", label: "Valor 1: texto", rows: 2 },
      { name: "value2Title", label: "Valor 2: título" },
      { name: "value2Text", label: "Valor 2: texto", rows: 2 },
      { name: "value3Title", label: "Valor 3: título" },
      { name: "value3Text", label: "Valor 3: texto", rows: 2 }
    ]
  },
  {
    key: "shipping",
    label: "Envíos y zonas",
    fields: [
      { name: "shippingIntro", label: "Texto de presentación", rows: 2 },
      { name: "shippingInfo", label: "Condiciones de envío (opcional)", rich: true, rows: 7, placeholder: "Ej:\n- Entregamos de lunes a sábado.\n- **Pedidos antes de las 12 hs** salen en el día." }
    ]
  },
  {
    key: "contact",
    label: "Contacto",
    fields: [
      { name: "contactTitle", label: "Título" },
      { name: "contactText", label: "Texto", rich: true, rows: 3 },
      { name: "contactPhone", label: "Teléfono fijo (opcional)", placeholder: "Ej: 381 421-0000" },
      { name: "whatsappNumber", label: "WhatsApp (solo números)", config: true, placeholder: "3814091213" },
      { name: "contactEmail", label: "Email (opcional)", placeholder: "ventas@..." },
      { name: "instagram", label: "Link de Instagram", config: true, placeholder: "https://instagram.com/..." },
      { name: "facebook", label: "Link de Facebook", config: true, placeholder: "https://facebook.com/..." },
      { name: "contactHours", label: "Horarios de atención (opcional)", rich: true, rows: 4, placeholder: "Ej:\n- Lunes a viernes: 8:30 a 21 hs\n- Sábados: 9 a 13 hs" }
    ]
  }
];
const CONFIG_FIELDS = ["whatsappNumber", "instagram", "facebook"];

/** Cuadro de texto con botones de Negrita y Lista (sin tener que saber nada de formato). */
function FormatTextarea({ name, label, rows, placeholder, register, setValue, getValues, error }) {
  const ref = useRef(null);
  const { ref: formRef, ...field } = register(name);

  function wrapBold() {
    const el = ref.current;
    const value = getValues(name) || "";
    const [start, end] = [el.selectionStart, el.selectionEnd];
    const selected = value.slice(start, end) || "texto en negrita";
    setValue(name, `${value.slice(0, start)}**${selected}**${value.slice(end)}`, { shouldDirty: true, shouldValidate: true });
    el.focus();
  }
  function toggleList() {
    const el = ref.current;
    const value = getValues(name) || "";
    const lineStart = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    let lineEnd = value.indexOf("\n", el.selectionEnd);
    if (lineEnd === -1) lineEnd = value.length;
    const block = value
      .slice(lineStart, lineEnd)
      .split("\n")
      .map((l) => (l.startsWith("- ") ? l.slice(2) : `- ${l}`))
      .join("\n");
    setValue(name, value.slice(0, lineStart) + block + value.slice(lineEnd), { shouldDirty: true, shouldValidate: true });
    el.focus();
  }

  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-2">
        <label htmlFor={name} className="text-sm font-medium text-ink-700">
          {label}
        </label>
        <div className="flex gap-1">
          <button type="button" onClick={wrapBold} className="flex items-center gap-1 rounded-lg border border-ink-200 px-2 py-1 text-xs font-bold text-ink-700 hover:border-brand-300">
            <Bold className="h-3.5 w-3.5" /> Negrita
          </button>
          <button type="button" onClick={toggleList} className="flex items-center gap-1 rounded-lg border border-ink-200 px-2 py-1 text-xs font-semibold text-ink-700 hover:border-brand-300">
            <List className="h-3.5 w-3.5" /> Lista
          </button>
        </div>
      </div>
      <textarea
        id={name}
        rows={rows || 4}
        placeholder={placeholder}
        {...field}
        ref={(el) => {
          formRef(el);
          ref.current = el;
        }}
        className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
      />
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  );
}

function Preview({ tab, values }) {
  const c = mergeContent(values);
  if (tab === "about") {
    return (
      <div className="space-y-3 text-sm text-ink-600">
        <RichText text={c.aboutIntro} className="space-y-2" />
        <p className="font-display text-lg font-bold text-ink-900">{c.aboutStoryTitle}</p>
        <RichText text={c.aboutStory} className="space-y-2" />
        <p className="rounded-xl bg-brand-600 p-3 font-semibold text-white">“{c.aboutQuote}”</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-xl border border-ink-100 p-2">
              <p className="font-semibold text-ink-900">{c[`value${n}Title`]}</p>
              <p className="text-xs">{c[`value${n}Text`]}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (tab === "shipping") {
    return (
      <div className="space-y-3 text-sm text-ink-600">
        <p>{c.shippingIntro}</p>
        {c.shippingInfo ? (
          <div>
            <p className="font-semibold text-ink-900">Condiciones de envío</p>
            <RichText text={c.shippingInfo} className="mt-1 space-y-2" />
          </div>
        ) : (
          <p className="text-xs text-ink-400">Sin condiciones: esa parte no se muestra.</p>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-3 text-sm text-ink-600">
      <p className="font-display text-lg font-bold text-ink-900">{c.contactTitle}</p>
      <RichText text={c.contactText} className="space-y-2" />
      <ul className="space-y-1">
        {c.contactPhone && <li>Teléfono: {c.contactPhone}</li>}
        {values.whatsappNumber && <li>WhatsApp: {values.whatsappNumber}</li>}
        {c.contactEmail && <li>Email: {c.contactEmail}</li>}
        {values.instagram && <li>Instagram: {values.instagram}</li>}
        {values.facebook && <li>Facebook: {values.facebook}</li>}
      </ul>
      {c.contactHours && (
        <div>
          <p className="font-semibold text-ink-900">Horarios</p>
          <RichText text={c.contactHours} className="mt-1 space-y-2" />
        </div>
      )}
    </div>
  );
}

const valuesFrom = (config) => ({
  ...Object.fromEntries(Object.keys(LIMITS).map((k) => [k, config?.content?.[k] || ""])),
  whatsappNumber: config?.whatsappNumber || "",
  instagram: config?.instagram || "",
  facebook: config?.facebook || ""
});

// Textos de Quiénes somos, Envíos y zonas y Contacto, con vista previa antes de guardar.
export default function TextosAdmin() {
  const setGlobalConfig = useSiteConfigStore((s) => s.setConfig);
  const [tab, setTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty }
  } = useForm({ resolver: zodResolver(schema), defaultValues: valuesFrom(null) });
  const values = watch();

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/site-config", { params: { fresh: "1" } });
      reset(valuesFrom(data));
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(form) {
    const confirmed = await confirmAction({
      title: "¿Guardar los textos?",
      text: "Los cambios se ven en la tienda al instante. Los campos vacíos muestran el texto original.",
      confirmText: "Sí, guardar",
      icon: "question"
    });
    if (!confirmed) return;
    const content = Object.fromEntries(Object.keys(LIMITS).map((k) => [k, form[k] || ""]));
    const extra = Object.fromEntries(CONFIG_FIELDS.map((k) => [k, form[k] || ""]));
    try {
      const { data } = await api.put("/site-config", { content, ...extra });
      setGlobalConfig(data);
      reset(valuesFrom(data));
      resultAlert({ title: "¡Listo!", text: "Los textos se guardaron y ya se ven en la tienda." });
    } catch (err) {
      resultAlert({ title: "No pudimos guardar", text: apiErrorMessage(err, "Revisá los textos y probá de nuevo."), icon: "error" });
    }
  }

  if (loadError) return <LoadError message="No pudimos cargar los textos." onRetry={load} />;
  if (loading) return <PageLoader />;
  const current = TABS.find((t) => t.key === tab);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-ink-900">Textos de la tienda</h1>
      <p className="mt-1 text-sm text-ink-600">
        Cambiá los textos de estas páginas. Podés usar <b>Negrita</b> y <b>Lista</b>, y dejar una línea en blanco para separar
        párrafos. Si dejás un campo vacío, se muestra el texto original.
      </p>

      <div role="tablist" className="mt-5 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === t.key ? "bg-brand-600 text-white" : "bg-white text-ink-700 ring-1 ring-ink-200"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, () => resultAlert({ title: "Revisá los campos", text: "Hay textos con errores (marcados en rojo).", icon: "error" }))}>
        <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4 rounded-2xl border border-ink-100 bg-white p-5">
            {current.fields.map((f) =>
              f.rich || f.rows ? (
                f.rich ? (
                  <FormatTextarea
                    key={f.name}
                    {...f}
                    placeholder={f.placeholder || DEFAULT_CONTENT[f.name]}
                    register={register}
                    setValue={setValue}
                    getValues={getValues}
                    error={errors[f.name]?.message}
                  />
                ) : (
                  <div key={f.name}>
                    <label htmlFor={f.name} className="mb-1.5 block text-sm font-medium text-ink-700">
                      {f.label}
                    </label>
                    <textarea
                      id={f.name}
                      rows={f.rows}
                      placeholder={f.placeholder || DEFAULT_CONTENT[f.name]}
                      {...register(f.name)}
                      className="w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
                    />
                    {errors[f.name] && <p className="mt-1 text-xs text-danger-600">{errors[f.name].message}</p>}
                  </div>
                )
              ) : (
                <Input key={f.name} label={f.label} placeholder={f.placeholder || DEFAULT_CONTENT[f.name] || ""} {...register(f.name)} error={errors[f.name]?.message} />
              )
            )}

            {tab === "shipping" && (
              <p className="rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
                La lista de zonas con su costo y compra mínima se carga en{" "}
                <Link to="/admin/zonas-envio" className="font-semibold text-brand-600 hover:underline">
                  Zonas de envío
                </Link>
                . Los tiempos de entrega, en{" "}
                <Link to="/admin/configuracion" className="font-semibold text-brand-600 hover:underline">
                  Configuración
                </Link>
                .
              </p>
            )}
            {tab === "contact" && (
              <p className="rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
                Las sucursales (dirección y horario de cada una) se cargan en{" "}
                <Link to="/admin/sucursales" className="font-semibold text-brand-600 hover:underline">
                  Sucursales
                </Link>
                .
              </p>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-ink-100 bg-white p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-900">
                <Eye className="h-4 w-4 text-brand-600" /> Vista previa
              </p>
              <Preview tab={tab} values={values} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? <Spinner className="h-4 w-4" /> : isDirty ? "Guardar textos" : "Sin cambios para guardar"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
