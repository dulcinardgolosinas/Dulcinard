import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { ProtectedRoute, AdminRoute } from "./routes/ProtectedRoute";

import Home from "./pages/Home";
import QuienesSomos from "./pages/QuienesSomos";
import Contacto from "./pages/Contacto";
import ZonasEnvio from "./pages/ZonasEnvio";
import Catalogo from "./pages/Catalogo";
import ProductoDetalle from "./pages/ProductoDetalle";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Checkout from "./pages/Checkout";
import Perfil from "./pages/Perfil";
import Pedidos from "./pages/Pedidos";
import PedidoDetalle from "./pages/PedidoDetalle";
import NotFound from "./pages/NotFound";

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProductosAdmin from "./pages/admin/ProductosAdmin";
import ProductoForm from "./pages/admin/ProductoForm";
import CategoriasAdmin from "./pages/admin/CategoriasAdmin";
import PromocionesAdmin from "./pages/admin/PromocionesAdmin";
import UsuariosAdmin from "./pages/admin/UsuariosAdmin";
import PedidosAdmin from "./pages/admin/PedidosAdmin";
import PedidoDetalleAdmin from "./pages/admin/PedidoDetalleAdmin";
import SucursalesAdmin from "./pages/admin/SucursalesAdmin";
import ZonasEnvioAdmin from "./pages/admin/ZonasEnvioAdmin";
import ConfiguracionAdmin from "./pages/admin/ConfiguracionAdmin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/envios" element={<ZonasEnvio />} />
          <Route path="/catalogo" element={<Catalogo />} />
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
            <Route path="productos/:id/editar" element={<ProductoForm />} />
            <Route path="categorias" element={<CategoriasAdmin />} />
            <Route path="promociones" element={<PromocionesAdmin />} />
            <Route path="usuarios" element={<UsuariosAdmin />} />
            <Route path="pedidos" element={<PedidosAdmin />} />
            <Route path="pedidos/:id" element={<PedidoDetalleAdmin />} />
            <Route path="sucursales" element={<SucursalesAdmin />} />
            <Route path="zonas-envio" element={<ZonasEnvioAdmin />} />
            <Route path="configuracion" element={<ConfiguracionAdmin />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
