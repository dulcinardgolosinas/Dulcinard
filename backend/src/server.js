import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`[server] Dulci-Nard API escuchando en puerto ${PORT}`));
  } catch (err) {
    console.error("[server] Error al iniciar:", err.message);
    process.exit(1);
  }
}

start();
