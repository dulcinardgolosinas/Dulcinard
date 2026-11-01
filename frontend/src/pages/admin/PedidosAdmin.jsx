import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../lib/api";
import { PageLoader } from "../../components/ui/Spinner";
import { Badge, ORDER_STATUS_LABELS } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import {
  formatCurrency,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  CONFIRMED_ORDER_STATUSES
} from "../../lib/format";
import { useSearchFilters } from "../../lib/useSearchFilters";
import { buildAdminOrderWhatsappHref } from "../../lib/whatsapp";
import { WhatsappIcon } from "../../components/ui/WhatsappIcon";
import { toastSuccess, toastError, confirmAction } from "../../lib/alerts";
import { downloadFromApi } from "../../lib/download";
import { FileSpreadsheet } from "lucide-react";

const STATUSES = Object.keys(ORDER_STATUS_LABELS);

const toInputDate = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const formatInputDate = (value) => value.split("-").reverse().join("/");

// Excel con los pedidos entregados entre dos fechas (por defecto, el mes actual).
function DeliveredExport() {
  const now = new Date();
  const [from, setFrom] = useState(toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(toInputDate(now));
  const [downloading, setDownloading] = useState(false);

  async function download() {
    if (from && to && from > to) return toastError("La fecha \"desde\" tiene que ser anterior a la fecha \"hasta\"");
    const range = from && to ? `del ${formatInputDate(from)} al ${formatInputDate(to)}` : from ? `desde el ${formatInputDate(from)}` : to ? `hasta el ${formatInputDate(to)}` : "de todas las fechas";
    const confirmed = await confirmAction({
      title: "¿Descargar pedidos entregados?",
      text: `Se va a descargar un Excel con los pedidos entregados ${range}.`,
      confirmText: "Sí, descargar",
      icon: "question"
    });
    if (!confirmed) return;
    setDownloading(true);
    try {
      await downloadFromApi("/orders/export/delivered", { params: { from: from || undefined, to: to || undefined }, fallbackName: "pedidos-entregados.xlsx" });
      toastSuccess("Excel descargado");
    } catch (err) {
      toastError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-ink-100 bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
        <FileSpreadsheet className="h-4 w-4 text-brand-600" />
        Descargar pedidos entregados en Excel
      </p>
      <p className="mt-1 text-xs text-ink-500">Incluye fecha, cliente, productos, cantidades y total de cada pedido entregado entre esas fechas.</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Desde</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-ink-200 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Hasta</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-ink-200 px-3 py-2 text-sm" />
        </label>
        <Button onClick={download} disabled={downloading}>
          {downloading ? "Descargando..." : "Descargar Excel"}
        </Button>
      </div>
    </div>
  );
}
const PAGE_SIZE = 20;

const FILTER_DEFAULTS = { status: "", paymentMethod: "", from: "", to: "", page: "1" };

const STATUS_SELECT_TONES = {
  pendiente: "border-ink-200 bg-white text-ink-700",
  confirmado: "border-brand-200 bg-brand-50 text-brand-600",
  en_preparacion: "border-brand-200 bg-brand-50 text-brand-600",
  enviado: "border-brand-200 bg-brand-50 text-brand-600",
  entregado: "border-brand-600 bg-brand-600 text-white",
  cancelado: "border-ink-300 bg-ink-100 text-ink-600"
};

const fieldClass =
  "rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500";

function StatusSelect({ order, onChanged }) {
  const [saving, setSaving] = useState(false);
  const paid = order.paymentStatus === "aprobado";

  async function handleChange(e) {
    const nextStatus = e.target.value;
    if (nextStatus === order.status) return;
    const confirmed = await confirmAction({
      title: "¿Cambiar el estado del pedido?",
      text: `El pedido va a pasar de "${ORDER_STATUS_LABELS[order.status]}" a "${ORDER_STATUS_LABELS[nextStatus]}".`,
      confirmText: "Sí, cambiar",
      icon: "question"
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/orders/${order._id}/status`, { status: nextStatus });
      onChanged(data);
      toastSuccess(`Pedido marcado como "${ORDER_STATUS_LABELS[nextStatus]}"`);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos actualizar el estado del pedido"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={order.status}
      onChange={handleChange}
      disabled={saving}
      aria-label="Estado del pedido"
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none disabled:opacity-50 ${
        STATUS_SELECT_TONES[order.status] || STATUS_SELECT_TONES.pendiente
      }`}
    >
      {STATUSES.map((s) => (
        // Sin pago confirmado no se puede avanzar el pedido (el stock se descuenta al confirmar).
        <option key={s} value={s} disabled={!paid && CONFIRMED_ORDER_STATUSES.includes(s)}>
          {ORDER_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

export default function PedidosAdmin() {
  const [filters, setFilters] = useSearchFilters(FILTER_DEFAULTS);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders", {
        params: {
          status: filters.status || undefined,
          paymentMethod: filters.paymentMethod || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          page: filters.page,
          limit: PAGE_SIZE
        }
      });
      setData(data);
    } catch (err) {
      toastError(apiErrorMessage(err, "No pudimos cargar los pedidos"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  function handleStatusChanged(updated) {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((o) => (o._id === updated._id ? { ...o, status: updated.status } : o))
    }));
  }

  const hasFilters = Boolean(filters.status || filters.paymentMethod || filters.from || filters.to);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Pedidos</h1>

      <DeliveredExport />

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => setFilters({ status: "" })}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${!filters.status ? "border-brand-600 bg-brand-50 text-brand-600" : "border-ink-200 text-ink-600"}`}
        >
          Todos
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilters({ status: s })}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filters.status === s ? "border-brand-600 bg-brand-50 text-brand-600" : "border-ink-200 text-ink-600"}`}
          >
            {ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-ink-100 bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Método de pago</span>
          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters({ paymentMethod: e.target.value })}
            className={fieldClass}
          >
            <option value="">Todos</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Desde</span>
          <input
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => setFilters({ from: e.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Hasta</span>
          <input
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => setFilters({ to: e.target.value })}
            className={fieldClass}
          />
        </label>
        {hasFilters && (
          <Button variant="ghost" onClick={() => setFilters({ status: "", paymentMethod: "", from: "", to: "" })}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => {
                  const whatsappHref = buildAdminOrderWhatsappHref(o);
                  return (
                    <tr key={o._id} className="border-t border-ink-50">
                      <td className="px-4 py-3 font-medium text-ink-900">#{o._id.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3 text-ink-600">{o.user?.name || o.user?.email}</td>
                      <td className="px-4 py-3 text-ink-600">{new Date(o.createdAt).toLocaleDateString("es-AR")}</td>
                      <td className="px-4 py-3 font-semibold text-ink-900">{formatCurrency(o.total)}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-ink-700">{PAYMENT_METHOD_LABELS[o.paymentMethod] || o.paymentMethod}</p>
                        <Badge tone={PAYMENT_STATUS_TONES[o.paymentStatus]} className="mt-1">
                          {PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <StatusSelect order={o} onChanged={handleStatusChanged} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          {whatsappHref && (
                            <a
                              href={whatsappHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Coordinar por WhatsApp"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
                            >
                              <WhatsappIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <Link to={`/admin/pedidos/${o._id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                            {o.paymentStatus !== "aprobado" && o.paymentMethod !== "mercado_pago" && o.status !== "cancelado"
                              ? "Marcar como pagado"
                              : "Ver detalle"}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                      No hay pedidos que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            limit={data.limit || PAGE_SIZE}
            itemLabel="pedidos"
            onPageChange={(page) => setFilters({ page })}
          />
        </>
      )}
    </div>
  );
}
