import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../../lib/api";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { confirmAction, toastSuccess, toastError } from "../../lib/alerts";
import { useSiteConfigStore } from "../../store/siteConfigStore";
import { DEFAULT_CONTENT } from "../../lib/siteContent";

// Largo máximo de cada texto (igual que CONTENT_FIELDS en el backend).
const LIMITS = {
  homeTagline: 80,
  homeSubtitle: 300,
  aboutIntro: 500,
  aboutStoryTitle: 120,
  aboutStory: 3000,
  aboutQuote: 300,
  aboutQuoteNote: 200,
  value1Title: 40,
  value1Text: 200,
  value2Title: 40,
  value2Text: 200,
  value3Title: 40,
  value3Text: 200,
  contactTitle: 80,
  contactText: 400,
  footerText: 300
};

const schema = z.object(
  Object.fromEntries(
    Object.entries(LIMITS).map(([key, max]) => [key, z.string().trim().max(max, `Este texto puede tener hasta ${max} caracteres`)])
  )
);

const SECTIONS = [
  {
    title: "Página principal",
    help: "Lo que se lee sobre las fotos grandes de arriba de todo.",
    fields: [
      { key: "homeTagline", label: "Frase chica de arriba" },
      { key: "homeSubtitle", label: "Texto debajo del nombre", rows: 3 }
    ]
  },
  {
    title: "Quiénes somos",
    fields: [
      { key: "aboutIntro", label: "Texto de presentación (arriba de la página)", rows: 3 },
      { key: "aboutStoryTitle", label: "Título de la historia" },
      { key: "aboutStory", label: "Historia (dejá una línea en blanco para separar párrafos)", rows: 9 },
      { key: "aboutQuote", label: "Frase destacada", rows: 2 },
      { key: "aboutQuoteNote", label: "Texto debajo de la frase destacada", rows: 2 },
      { key: "value1Title", label: "Recuadro 1: título", half: true },
      { key: "value1Text", label: "Recuadro 1: texto", half: true },
      { key: "value2Title", label: "Recuadro 2: título", half: true },
      { key: "value2Text", label: "Recuadro 2: texto", half: true },
      { key: "value3Title", label: "Recuadro 3: título", half: true },
      { key: "value3Text", label: "Recuadro 3: texto", half: true }
    ]
  },
  {
    title: "Contacto",
    fields: [
      { key: "contactTitle", label: "Título" },
      { key: "contactText", label: "Texto", rows: 3 }
    ]
  },
  {
    title: "Pie de página",
    help: "El texto que aparece debajo del logo, al final de todas las páginas.",
    fields: [{ key: "footerText", label: "Texto", rows: 3 }]
  }
];

const withDefaults = (content) =>
  Object.fromEntries(Object.keys(LIMITS).map((key) => [key, content?.[key]?.trim() ? content[key] : DEFAULT_CONTENT[key]]));

export default function TextosAdmin() {
  const setGlobalConfig = useSiteConfigStore((s) => s.setConfig);
  const [loading, setLoading] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty }
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    api
      .get("/site-config")
      .then(({ data }) => reset(withDefaults(data.content)))
      .catch((err) => toastError(apiErrorMessage(err, "No pudimos cargar los textos")))
      .finally(() => setLoading(false));
  }, [reset]);

  async function save(content, { title, text, success }) {
    const confirmed = await confirmAction({ title, text, confirmText: "Sí, guardar", icon: "question" });
    if (!confirmed) return;
    try {
      // Un texto igual al original se guarda vacío: así sigue al texto por defecto.
      const payload = Object.fromEntries(Object.entries(content).map(([k, v]) => [k, v.trim() === DEFAULT_CONTENT[k] ? "" : v]));
      const { data } = await api.put("/site-config", { content: payload });
      setGlobalConfig(data);
      reset(withDefaults(data.content));
      toastSuccess(success);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos guardar los textos"));
    }
  }

  function onSubmit(values) {
    return save(values, {
      title: "¿Guardar los textos?",
      text: "Los textos nuevos se ven en la tienda apenas los guardes.",
      success: "Textos actualizados"
    });
  }

  function restoreDefaults() {
    return save(Object.fromEntries(Object.keys(LIMITS).map((k) => [k, ""])), {
      title: "¿Volver a los textos originales?",
      text: "Todos los textos de la tienda vuelven a ser los que venían de fábrica.",
      success: "Se restauraron los textos originales"
    });
  }

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-ink-900">Textos de la tienda</h1>
      <p className="mt-1 text-sm text-ink-500">
        Cambiá lo que dicen las páginas de la tienda. Los cambios se ven apenas guardás.
      </p>

      <form onSubmit={handleSubmit(onSubmit, () => toastError("Revisá los textos marcados en rojo"))} className="mt-6 space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="rounded-2xl border border-ink-100 bg-white p-5">
            <p className="font-semibold text-ink-900">{section.title}</p>
            {section.help && <p className="mt-1 text-xs text-ink-500">{section.help}</p>}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {section.fields.map(({ key, label, rows, half }) => (
                <div key={key} className={half ? "" : "sm:col-span-2"}>
                  {rows ? (
                    <Textarea label={label} rows={rows} {...register(key)} error={errors[key]?.message} />
                  ) : (
                    <Input label={label} {...register(key)} error={errors[key]?.message} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-ink-100 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? <Spinner className="h-4 w-4" /> : "Guardar textos"}
          </Button>
          <Button type="button" variant="ghost" onClick={restoreDefaults} disabled={isSubmitting}>
            Volver a los textos originales
          </Button>
          {isDirty && <span className="text-xs text-ink-500">Tenés cambios sin guardar</span>}
        </div>
      </form>
    </div>
  );
}
