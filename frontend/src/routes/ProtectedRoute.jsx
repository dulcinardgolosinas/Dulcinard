import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";
import { PageLoader } from "../components/ui/Spinner";

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

// El rol guardado en localStorage se puede editar desde la consola, así que
// antes de mostrar el panel se confirma con el servidor (/auth/me). La API
// igual rechaza cualquier acción de admin sin el rol real; esto evita además
// mostrar el panel a alguien a quien le quitaron el rol.
export function AdminRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateUser = useAuthStore((s) => s.updateUser);
  const location = useLocation();
  const [status, setStatus] = useState("checking"); // "checking" | "admin" | "denied"

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    api
      .get("/auth/me")
      .then(({ data }) => {
        if (cancelled) return;
        updateUser(data.user);
        setStatus(data.user?.role === "admin" ? "admin" : "denied");
      })
      .catch(() => !cancelled && setStatus("denied"));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, updateUser]);

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (status === "checking") return <PageLoader />;
  if (status === "denied") return <Navigate to="/" replace />;
  return <Outlet />;
}
