import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import siteConfigRoutes from "./routes/siteConfigRoutes.js";
import shippingZoneRoutes from "./routes/shippingZoneRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

app.use(notFound);
app.use(errorHandler);

export default app;
