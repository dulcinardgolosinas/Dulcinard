import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LogOut } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Input, PasswordInput } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { confirmLogout, toastSuccess, toastError } from "../lib/alerts";
import { nameField, optionalAlphanumericField, phoneField, passwordField } from "../lib/validators";

const profileSchema = z.object({
  name: nameField("El nombre"),
  businessName: optionalAlphanumericField("El nombre del negocio", { max: 100 }),
  phone: phoneField()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
  newPassword: passwordField({ label: "La nueva contraseña" })
});

function ProfileForm() {
  const { user, updateUser } = useAuthStore();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, businessName: user?.businessName, phone: user?.phone }
  });

  async function onSubmit(values) {
    setMessage("");
    setError("");
    try {
      const { data } = await api.put("/auth/me", values);
      updateUser(data.user);
      setMessage("Tus datos se actualizaron correctamente.");
      toastSuccess("Datos actualizados");
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toastError(msg);
    }
  }

  function onInvalid() {
    toastError("Completá los campos obligatorios");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
      <Input label="Nombre y apellido" {...register("name")} error={errors.name?.message} />
      <Input label="Nombre del negocio" {...register("businessName")} error={errors.businessName?.message} />
      <Input label="Teléfono" {...register("phone")} error={errors.phone?.message} />
      {message && <p className="text-sm text-brand-600">{message}</p>}
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        Guardar cambios
      </Button>
    </form>
  );
}

function PasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  async function onSubmit(values) {
    setMessage("");
    setError("");
    try {
      const { data } = await api.put("/auth/me/password", values);
      // El cambio cierra las demás sesiones: esta sigue con el token nuevo.
      if (data.token) useAuthStore.setState({ token: data.token });
      setMessage("Contraseña actualizada.");
      toastSuccess("Contraseña actualizada");
      reset();
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toastError(msg);
    }
  }

  function onInvalid() {
    toastError("Completá ambos campos de contraseña");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
      <PasswordInput label="Contraseña actual" {...register("currentPassword")} error={errors.currentPassword?.message} />
      <PasswordInput label="Nueva contraseña" {...register("newPassword")} error={errors.newPassword?.message} />
      {message && <p className="text-sm text-brand-600">{message}</p>}
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <Button type="submit" variant="outline" disabled={isSubmitting}>
        Cambiar contraseña
      </Button>
    </form>
  );
}

export default function Perfil() {
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    const confirmed = await confirmLogout();
    if (!confirmed) return;
    logout();
    toastSuccess("Cerraste sesión correctamente");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Mi cuenta</h1>
          <p className="mt-1 text-sm text-ink-500">{user?.email}</p>
        </div>
        <button onClick={handleLogout} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-danger-600">
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>

      <Link to="/pedidos" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
        Ver historial de pedidos
        <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </Link>
      {user?.role === "admin" && (
        <Link to="/admin" className="mt-2 ml-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">
          Ir al panel admin
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      )}

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-semibold text-ink-900">Datos personales</h2>
          <ProfileForm />
        </section>
        <section className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-semibold text-ink-900">Seguridad</h2>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
