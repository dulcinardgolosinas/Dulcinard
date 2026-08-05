# Dulci-Nard Tucumán — E-commerce mayorista

Sistema web para Dulci-Nard: tienda mayorista de golosinas con catálogo, carrito,
checkout con Mercado Pago y panel de administración. Stack MERN (React + Vite,
Node/Express, MongoDB/Mongoose) con imágenes gestionadas en Cloudinary.

## Estructura

```
backend/    API REST (Express + Mongoose + Cloudinary + Mercado Pago)
frontend/   SPA (React + Vite + Tailwind v4 + Zustand + React Hook Form/Zod)
```

## Requisitos

- Node.js 18+
- Una base MongoDB (Atlas o local)
- Una cuenta de Cloudinary (para imágenes de productos, categorías, promos y logo)
- Credenciales de Mercado Pago (Access Token) para el checkout

## Backend

```bash
cd backend
npm install
cp .env.example .env   # completar MONGO_URI, CLOUDINARY_*, MP_ACCESS_TOKEN, JWT_SECRET
npm run seed            # carga sucursales, zonas de envío, categorías, admin y productos de ejemplo
npm run dev              # http://localhost:4000
```

El usuario admin se crea con `ADMIN_EMAIL` / `ADMIN_PASSWORD` definidos en `.env`.

## Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:4000/api
npm run dev              # http://localhost:5173
```

## Notas de configuración

- Todos los montos (mínimo de compra, costo de envío, envío gratis desde) son
  editables desde **/admin/configuracion** y **/admin/zonas-envio** — no están
  hardcodeados.
- Las 4 sucursales (dirección, horarios, teléfono) se administran desde
  **/admin/sucursales**.
- Las imágenes (logo, productos, categorías, banners de promociones) se suben
  directamente a Cloudinary desde el panel admin; en Mongo solo se guarda la
  `url` y el `publicId`.
- El checkout usa Mercado Pago Checkout Pro: al confirmar el pedido se crea una
  preferencia de pago y se redirige al usuario a Mercado Pago.
