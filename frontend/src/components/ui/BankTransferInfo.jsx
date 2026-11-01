import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatCurrency } from "../../lib/format";

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el dato igual se ve y se puede seleccionar.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{label}</p>
        <p className="break-all font-mono text-sm font-semibold text-ink-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex shrink-0 items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:border-brand-300 hover:text-brand-700"
        aria-label={`Copiar ${label}`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

/** Datos para pagar por transferencia (se cargan en el panel, en Configuración). */
export function BankTransferInfo({ bank, amount, className = "" }) {
  if (!bank?.alias && !bank?.cbu) return null;
  return (
    <div className={`rounded-2xl border border-brand-200 bg-brand-50/60 p-4 ${className}`}>
      <p className="text-sm font-semibold text-ink-900">Datos para la transferencia</p>
      {amount != null && (
        <p className="mt-1 text-sm text-ink-700">
          Monto a transferir: <strong className="text-brand-600">{formatCurrency(amount)}</strong>
        </p>
      )}
      <div className="mt-2 divide-y divide-brand-100">
        <CopyRow label="Alias" value={bank.alias} />
        <CopyRow label="CBU / CVU" value={bank.cbu} />
        {bank.holder && (
          <div className="py-2">
            <p className="text-xs text-ink-500">Titular</p>
            <p className="text-sm font-semibold text-ink-900">{bank.holder}</p>
          </div>
        )}
        {bank.bankName && (
          <div className="py-2">
            <p className="text-xs text-ink-500">Banco</p>
            <p className="text-sm font-semibold text-ink-900">{bank.bankName}</p>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-600">
        Cuando hagas la transferencia, mandanos el comprobante por WhatsApp. Preparamos el pedido apenas confirmemos el pago.
      </p>
    </div>
  );
}
