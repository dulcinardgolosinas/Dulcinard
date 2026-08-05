import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Input, PasswordInput } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { toastSuccess, toastError } from "../lib/alerts";
import { nameField, alphanumericField, emailField, phoneField, passwordField } from "../lib/validators";

const schema = z
  .object({
    firstName: nameField("El nombre", { max: 40 }),
    lastName: nameField("El apellido", { max: 40 }),
    businessName: alphanumericField("El nombre del negocio", { min: 2, max: 100 }),
    email: emailField,
    phone: phoneField({ required: true }),
    password: passwordField(),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
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
      const { data } = await api.post("/auth/register", {
        name: `${values.firstName} ${values.lastName}`,
        businessName: values.businessName,
        email: values.email,
        phone: values.phone,
        password: values.password
      });
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
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nombre" {...register("firstName")} error={errors.firstName?.message} />
        <Input label="Apellido" {...register("lastName")} error={errors.lastName?.message} />
      </div>
      <Input label="Nombre del negocio" {...register("businessName")} error={errors.businessName?.message} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <Input label="Teléfono" {...register("phone")} error={errors.phone?.message} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PasswordInput label="Contraseña" {...register("password")} error={errors.password?.message} />
        <PasswordInput label="Confirmar contraseña" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
      </div>
      <p className="text-xs text-ink-400">Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.</p>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
