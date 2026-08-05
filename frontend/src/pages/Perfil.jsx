import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { api, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

function ProfileForm() {
  const { user, updateUser } = useAuthStore();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { name: user?.name, businessName: user?.businessName, phone: user?.phone }
  });

  async function onSubmit(values) {
    setMessage("");
    setError("");
    try {
      const { data } = await api.put("/auth/me", values);
      updateUser(data.user);
      setMessage("Tus datos se actualizaron correctamente.");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nombre y apellido" {...register("name")} />
      <Input label="Nombre del negocio" {...register("businessName")} />
      <Input label="Teléfono" {...register("phone")} />
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        Guardar cambios
      </Button>
    </form>
  );
}

function PasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  async function onSubmit(values) {
    setMessage("");
    setError("");
    try {
      await api.put("/auth/me/password", values);
      setMessage("Contraseña actualizada.");
      reset();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Contraseña actual" type="password" {...register("currentPassword", { required: true })} />
      <Input label="Nueva contraseña" type="password" {...register("newPassword", { required: true, minLength: 6 })} />
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" variant="outline" disabled={isSubmitting}>
        Cambiar contraseña
      </Button>
    </form>
  );
}

export default function Perfil() {
  const { user, logout } = useAuthStore();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Mi cuenta</h1>
          <p className="mt-1 text-sm text-ink-500">{user?.email}</p>
        </div>
        <button onClick={logout} className="text-sm font-semibold text-ink-500 hover:text-red-600">
          Cerrar sesión
        </button>
      </div>

      <Link to="/pedidos" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">
        Ver historial de pedidos →
      </Link>
      {user?.role === "admin" && (
        <Link to="/admin" className="mt-2 ml-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">
          Ir al panel admin →
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
