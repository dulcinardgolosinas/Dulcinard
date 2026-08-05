import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

const schema = z.object({
  name: z.string().min(2, "Ingresá tu nombre completo"),
  businessName: z.string().optional(),
  email: z.string().email("Ingresá un email válido"),
  phone: z.string().optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});

export default function Registro() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    setServerError("");
    try {
      const { data } = await api.post("/auth/register", values);
      setSession(data.user, data.token);
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(apiErrorMessage(err, "No pudimos crear tu cuenta"));
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-14">
      <h1 className="font-display text-3xl font-bold text-ink-900">Creá tu cuenta mayorista</h1>
      <p className="mt-2 text-sm text-ink-500">Registrate para hacer pedidos y ver tu historial de compras.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input label="Nombre y apellido" {...register("name")} error={errors.name?.message} />
        <Input label="Nombre del negocio (opcional)" {...register("businessName")} error={errors.businessName?.message} />
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <Input label="Teléfono (opcional)" {...register("phone")} error={errors.phone?.message} />
        <Input label="Contraseña" type="password" {...register("password")} error={errors.password?.message} />

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Ingresá
        </Link>
      </p>
    </div>
  );
}
