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

// Se bajan recién al abrirlas (el inicio, el catálogo y los productos van siempre).
const QuienesSomos = lazy(() => import("./pages/QuienesSomos"));
const Contacto = lazy(() => import("./pages/Contacto"));
const ZonasEnvio = lazy(() => import("./pages/ZonasEnvio"));
const Login = lazy(() => import("./pages/Login"));
const Registro = lazy(() => import("./pages/Registro"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Pedidos = lazy(() => import("./pages/Pedidos"));
const PedidoDetalle = lazy(() => import("./pages/PedidoDetalle"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ProductosAdmin = lazy(() => import("./pages/admin/ProductosAdmin"));
const ProductoForm = lazy(() => import("./pages/admin/ProductoForm"));
const ProductosImportar = lazy(() => import("./pages/admin/ProductosImportar"));
const ProductosFotos = lazy(() => import("./pages/admin/ProductosFotos"));
const StockExcel = lazy(() => import("./pages/admin/StockExcel"));
const CategoriasAdmin = lazy(() => import("./pages/admin/CategoriasAdmin"));
const PromocionesAdmin = lazy(() => import("./pages/admin/PromocionesAdmin"));
const UsuariosAdmin = lazy(() => import("./pages/admin/UsuariosAdmin"));
const PedidosAdmin = lazy(() => import("./pages/admin/PedidosAdmin"));
const PedidoDetalleAdmin = lazy(() => import("./pages/admin/PedidoDetalleAdmin"));
const SucursalesAdmin = lazy(() => import("./pages/admin/SucursalesAdmin"));
const ZonasEnvioAdmin = lazy(() => import("./pages/admin/ZonasEnvioAdmin"));
const ProveedoresAdmin = lazy(() => import("./pages/admin/ProveedoresAdmin"));
const ImagenesHeroAdmin = lazy(() => import("./pages/admin/ImagenesHeroAdmin"));
const ConfiguracionAdmin = lazy(() => import("./pages/admin/ConfiguracionAdmin"));

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
            <Route path="productos/importar" element={<ProductosImportar />} />
            <Route path="productos/fotos" element={<ProductosFotos />} />
            <Route path="productos/stock" element={<StockExcel />} />
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
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
