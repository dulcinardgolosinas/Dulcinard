import Swal from "sweetalert2";

// Paleta acorde a la marca para que los diálogos de SweetAlert2 no desentonen
// con el resto de la UI. Se toman las variables CSS de index.css (SweetAlert2
// las aplica como estilo inline), así siguen a la paleta centralizada.
const BRAND_CONFIRM_COLOR = "var(--color-brand-600)";
const BRAND_CANCEL_COLOR = "var(--color-ink-100)";
// El texto del botón de SweetAlert2 es blanco por defecto: con este fondo
// claro queda casi ilegible. El color oscuro se fuerza por CSS en index.css
// (.swal2-cancel), acá solo queda el fondo.

export function confirmAction({
  title = "¿Estás seguro?",
  text = "Esta acción no se puede deshacer.",
  confirmText = "Sí, continuar",
  cancelText = "Cancelar",
  icon = "warning"
} = {}) {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: BRAND_CONFIRM_COLOR,
    cancelButtonColor: BRAND_CANCEL_COLOR,
    reverseButtons: true,
    focusCancel: true
  }).then((result) => result.isConfirmed);
}

export function confirmDelete(itemLabel = "este elemento") {
  return confirmAction({
    title: "¿Eliminar?",
    text: `Vas a eliminar ${itemLabel}. Esta acción no se puede deshacer.`,
    confirmText: "Sí, eliminar",
    icon: "warning"
  });
}

export function paymentSuccessAlert(whatsappHref) {
  return Swal.fire({
    title: "¡Pago recibido!",
    text: "Tu pedido fue confirmado. Escribinos por WhatsApp para coordinar el envío.",
    icon: "success",
    confirmButtonText: "Contactar por WhatsApp",
    confirmButtonColor: BRAND_CONFIRM_COLOR,
    showCancelButton: true,
    cancelButtonText: "Cerrar",
    cancelButtonColor: BRAND_CANCEL_COLOR,
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) window.open(whatsappHref, "_blank", "noopener,noreferrer");
  });
}

export function paymentFailureAlert(onRetry) {
  return Swal.fire({
    title: "No pudimos procesar el pago",
    text: "Hubo un problema al pagar tu pedido. Podés intentarlo de nuevo.",
    icon: "error",
    confirmButtonText: "Reintentar pago",
    confirmButtonColor: BRAND_CONFIRM_COLOR,
    showCancelButton: true,
    cancelButtonText: "Cerrar",
    cancelButtonColor: BRAND_CANCEL_COLOR,
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) onRetry?.();
  });
}

export function confirmLogout() {
  return confirmAction({
    title: "¿Cerrar sesión?",
    text: "Vas a salir de tu cuenta.",
    confirmText: "Sí, cerrar sesión",
    icon: "question"
  });
}

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener("mouseenter", Swal.stopTimer);
    el.addEventListener("mouseleave", Swal.resumeTimer);
  }
});

export function toastSuccess(message = "Listo") {
  return Toast.fire({ icon: "success", title: message });
}

export function toastError(message = "Ocurrió un error") {
  return Toast.fire({ icon: "error", title: message });
}

export function toastWarning(message) {
  return Toast.fire({ icon: "warning", title: message });
}
