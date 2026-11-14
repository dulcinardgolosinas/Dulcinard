import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PageLoader } from "./components/ui/Spinner";
import { Layout } from "./components/layout/Layout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { ProtectedRoute, AdminRoute } from "./routes/ProtectedRoute";
import { ScrollToTop } from "./routes/ScrollToTop";
import Home from "./pages/Home";
import Catalogo from "./pages/Catalogo";
import ProductoDetalle from "./pages/ProductoDetalle";
import NotFound from "./pages/NotFound";

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProductosAdmin from "./pages/admin/ProductosAdmin";
import ProductoForm from "./pages/admin/ProductoForm";
import ProductosFotos from "./pages/admin/ProductosFotos";
import ProductosPlanilla from "./pages/admin/ProductosPlanilla";
import TextosAdmin from "./pages/admin/TextosAdmin";
import CategoriasAdmin from "./pages/admin/CategoriasAdmin";
import PromocionesAdmin from "./pages/admin/PromocionesAdmin";
import UsuariosAdmin from "./pages/admin/UsuariosAdmin";
import PedidosAdmin from "./pages/admin/PedidosAdmin";
import PedidoDetalleAdmin from "./pages/admin/PedidoDetalleAdmin";
import SucursalesAdmin from "./pages/admin/SucursalesAdmin";
import ZonasEnvioAdmin from "./pages/admin/ZonasEnvioAdmin";
import ProveedoresAdmin from "./pages/admin/ProveedoresAdmin";
import ImagenesHeroAdmin from "./pages/admin/ImagenesHeroAdmin";
import ConfiguracionAdmin from "./pages/admin/ConfiguracionAdmin";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Las páginas que no son el inicio ni el catálogo se bajan recién al abrirlas:
          así la tienda carga más rápido en el celular (sobre todo, sin el panel). */}
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/envios" element={<ZonasEnvio />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/productos" element={<Navigate to="/catalogo" replace />} />
          <Route path="/producto/:slug" element={<ProductoDetalle />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/pedidos/:id" element={<PedidoDetalle />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<ProductosAdmin />} />
            <Route path="productos/nuevo" element={<ProductoForm />} />
            <Route path="productos/importar" element={<Navigate to="/admin/productos/planilla" replace />} />
            <Route path="productos/fotos" element={<ProductosFotos />} />
            <Route path="productos/planilla" element={<ProductosPlanilla />} />
            {/* La pantalla vieja de stock ahora es parte de la planilla única. */}
            <Route path="productos/stock" element={<Navigate to="/admin/productos/planilla" replace />} />
            <Route path="productos/:id/editar" element={<ProductoForm />} />
            <Route path="categorias" element={<CategoriasAdmin />} />
            <Route path="promociones" element={<PromocionesAdmin />} />
            <Route path="usuarios" element={<UsuariosAdmin />} />
            <Route path="pedidos" element={<PedidosAdmin />} />
            <Route path="pedidos/:id" element={<PedidoDetalleAdmin />} />
            <Route path="sucursales" element={<SucursalesAdmin />} />
            <Route path="zonas-envio" element={<ZonasEnvioAdmin />} />
            <Route path="proveedores" element={<ProveedoresAdmin />} />
            <Route path="imagenes-hero" element={<ImagenesHeroAdmin />} />
            <Route path="configuracion" element={<ConfiguracionAdmin />} />
            <Route path="textos" element={<TextosAdmin />} />
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
