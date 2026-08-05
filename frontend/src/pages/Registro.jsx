import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Input, PasswordInput } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { toastSuccess, toastError } from "../lib/alerts";
import { nameField, optionalAlphanumericField, emailField, phoneField, passwordField } from "../lib/validators";

const schema = z.object({
  name: nameField("El nombre"),
  businessName: optionalAlphanumericField("El nombre del negocio", { max: 100 }),
  email: emailField,
  phone: phoneField(),
  password: passwordField()
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
      toastSuccess(`¡Cuenta creada! Bienvenido/a, ${data.user.name.split(" ")[0]}`);
      navigate("/", { replace: true });
    } catch (err) {
      const message = apiErrorMessage(err, "No pudimos crear tu cuenta");
      setServerError(message);
      toastError(message);
    }
  }

  function onInvalid() {
    toastError("Completá todos los campos obligatorios");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-14">
      <h1 className="font-display text-3xl font-bold text-ink-900">Creá tu cuenta mayorista</h1>
      <p className="mt-2 text-sm text-ink-500">Registrate para hacer pedidos y ver tu historial de compras.</p>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mt-8 space-y-4">
        <Input label="Nombre y apellido" {...register("name")} error={errors.name?.message} />
        <Input label="Nombre del negocio (opcional)" {...register("businessName")} error={errors.businessName?.message} />
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <Input label="Teléfono (opcional)" {...register("phone")} error={errors.phone?.message} />
        <PasswordInput label="Contraseña" {...register("password")} error={errors.password?.message} />

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
