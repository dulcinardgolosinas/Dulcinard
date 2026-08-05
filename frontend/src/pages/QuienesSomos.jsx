import { useSiteConfigStore } from "../store/siteConfigStore";

export default function QuienesSomos() {
  const config = useSiteConfigStore((s) => s.config);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:px-6">
      <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">Quiénes somos</span>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink-900 md:text-4xl">
        Más de una comunidad de kioscos y comercios confían en Dulci-Nard
      </h1>
      <p className="mt-6 text-ink-600 leading-relaxed">
        Dulci-Nard es una distribuidora mayorista de golosinas y productos alimenticios con sede en San Miguel de
        Tucumán. Con años de trayectoria en la región, acompañamos a kioscos, almacenes y comercios de todo Tucumán
        ofreciendo un catálogo amplio, precios mayoristas y una logística pensada para que nunca te falte mercadería.
      </p>
      <p className="mt-4 text-ink-600 leading-relaxed">
        Hoy contamos con {config?.branches?.length || 4} sucursales en San Miguel de Tucumán y Concepción, y una
        comunidad de casi 27 mil seguidores en Instagram que siguen de cerca nuestras novedades y promociones.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-100 bg-white p-6 text-center">
          <p className="font-display text-3xl font-bold text-brand-600">{config?.branches?.length || 4}</p>
          <p className="mt-1 text-sm text-ink-500">Sucursales en Tucumán</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-6 text-center">
          <p className="font-display text-3xl font-bold text-brand-600">24 hs</p>
          <p className="mt-1 text-sm text-ink-500">Entrega tras confirmar el pedido</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-6 text-center">
          <p className="font-display text-3xl font-bold text-brand-600">26,9 mil</p>
          <p className="mt-1 text-sm text-ink-500">Seguidores en Instagram</p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl bg-brand-50 p-6">
        <p className="font-semibold text-brand-800">Nuestro compromiso</p>
        <p className="mt-2 text-sm text-brand-700">
          Facilitarle a cada kiosco y comercio de Tucumán el acceso a golosinas y productos alimenticios al mejor
          precio mayorista, con un proceso de pedido simple por WhatsApp o desde nuestra tienda online.
        </p>
      </div>
    </div>
  );
}
