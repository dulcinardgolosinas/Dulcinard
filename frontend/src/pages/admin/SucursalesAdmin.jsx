import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../../lib/api";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { PageLoader, Spinner } from "../../components/ui/Spinner";
import { confirmDelete, toastSuccess, toastError } from "../../lib/alerts";
import { nameField, alphanumericField, phoneField, urlField } from "../../lib/validators";

const branchSchema = z.object({
  _id: z.string().optional(),
  name: nameField("El nombre de la sucursal", { min: 2, max: 80 }),
  address: alphanumericField("La dirección", { min: 3, max: 150 }),
  phone: phoneField({ label: "El teléfono" }),
  mapUrl: urlField({ label: "El link de Google Maps" }),
  active: z.boolean().optional(),
  schedule: z.object({
    weekdays: z.object({
      label: z.string().min(1),
      hours: z.string().trim().min(1, "Ingresá el horario de lunes a viernes").max(80, "El horario no puede superar los 80 caracteres")
    }),
    saturday: z.object({
      label: z.string().min(1),
      hours: z.string().trim().min(1, "Ingresá el horario de sábado").max(80, "El horario no puede superar los 80 caracteres")
    })
  })
});

const schema = z.object({
  branches: z.array(branchSchema)
});

const emptyBranch = () => ({
  name: "",
  address: "",
  phone: "",
  mapUrl: "",
  active: true,
  schedule: {
    weekdays: { label: "Lunes a Viernes", hours: "" },
    saturday: { label: "Sábado", hours: "" }
  }
});

export default function SucursalesAdmin() {
  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { branches: [] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "branches" });

  useEffect(() => {
    api.get("/site-config").then(({ data }) => {
      reset({ branches: data.branches?.length ? data.branches : [] });
    });
  }, [reset]);

  async function removeBranch(index) {
    const branch = getValues(`branches.${index}`);
    const confirmed = await confirmDelete(`la sucursal "${branch.name || "sin nombre"}"`);
    if (!confirmed) return;
    remove(index);
  }

  async function onSubmit(values) {
    try {
      await api.put("/site-config", { branches: JSON.stringify(values.branches) });
      toastSuccess("Sucursales actualizadas");
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos guardar las sucursales"));
    }
  }

  function onInvalid() {
    toastError("Revisá los campos marcados en rojo antes de guardar");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900">Sucursales</h1>
        <Button type="button" variant="outline" onClick={() => append(emptyBranch())}>
          + Agregar sucursal
        </Button>
      </div>

      <div className="mt-6 space-y-5">
        {fields.map((field, i) => {
          const branchErrors = errors.branches?.[i];
          return (
            <div key={field.id} className="rounded-2xl border border-ink-100 bg-white p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Nombre" {...register(`branches.${i}.name`)} error={branchErrors?.name?.message} />
                <Input label="Dirección" {...register(`branches.${i}.address`)} error={branchErrors?.address?.message} />
                <Input label="Teléfono (opcional)" {...register(`branches.${i}.phone`)} error={branchErrors?.phone?.message} />
                <Input label="Link de Google Maps (opcional)" {...register(`branches.${i}.mapUrl`)} error={branchErrors?.mapUrl?.message} />
                <Input
                  label="Horario Lunes a Viernes"
                  placeholder="8:30 a 21 hs"
                  {...register(`branches.${i}.schedule.weekdays.hours`)}
                  error={branchErrors?.schedule?.weekdays?.hours?.message}
                />
                <Input
                  label="Horario Sábado"
                  placeholder="9 a 13 y 17 a 20 hs"
                  {...register(`branches.${i}.schedule.saturday.hours`)}
                  error={branchErrors?.schedule?.saturday?.hours?.message}
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <input
                    type="checkbox"
                    {...register(`branches.${i}.active`)}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600"
                  />
                  Sucursal activa
                </label>
                <button type="button" onClick={() => removeBranch(i)} className="text-sm font-semibold text-red-600 hover:underline">
                  Eliminar sucursal
                </button>
              </div>
            </div>
          );
        })}

        {fields.length === 0 && <PageLoader />}
      </div>

      <div className="mt-6">
        <Button type="submit" disabled={isSubmitting || fields.length === 0}>
          {isSubmitting ? <Spinner className="h-4 w-4" /> : "Guardar sucursales"}
        </Button>
      </div>
    </form>
  );
}
