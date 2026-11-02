import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Input, PasswordInput } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { toastSuccess, toastError } from "../lib/alerts";
import { emailField } from "../lib/validators";
import { Seo } from "../components/Seo";

const schema = z.object({
  email: emailField,
  password: z.string().min(1, "Ingresá tu contraseña")
});

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
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
      const { data } = await api.post("/auth/login", values);
      setSession(data.user, data.token);
      toastSuccess(`¡Bienvenido/a, ${data.user.name.split(" ")[0]}!`);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      const message = apiErrorMessage(err, "No pudimos iniciar sesión");
      setServerError(message);
      toastError(message);
    }
  }

  function onInvalid() {
    toastError("Completá tu email y contraseña");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
      <Seo title="Ingresar" noIndex />
      <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
      <PasswordInput label="Contraseña" {...register("password")} error={errors.password?.message} />

      {serverError && <p className="text-sm text-danger-600">{serverError}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
