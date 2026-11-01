import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { sanitizeRequest } from "./middleware/security.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import siteConfigRoutes from "./routes/siteConfigRoutes.js";
import shippingZoneRoutes from "./routes/shippingZoneRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import pageHeroRoutes from "./routes/pageHeroRoutes.js";
import homeHeroRoutes from "./routes/homeHeroRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Detrás del proxy de Vercel: necesario para que el rate limit vea la IP real.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());
// CLIENT_URL puede tener varias direcciones separadas por coma (ej: el dominio
// propio con y sin www, y la de Vercel). La primera es la principal.
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : "*", credentials: true }));
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));
app.use(sanitizeRequest);
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "dulcinard-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/site-config", siteConfigRoutes);
app.use("/api/shipping-zones", shippingZoneRoutes);
app.use("/api/users", userRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/page-heroes", pageHeroRoutes);
app.use("/api/home-hero-images", homeHeroRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
