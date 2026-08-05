// Debe ser el primer import: en ESM los imports se evalúan antes que cualquier
// otra sentencia, así que un dotenv.config() colocado "primero" en el texto
// igual corre después de que módulos como config/cloudinary.js ya leyeron
// process.env. "dotenv/config" carga las variables como efecto secundario
// de su propia evaluación, que sí respeta el orden de los imports.
import "dotenv/config";

import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`[server] Dulcinard API escuchando en puerto ${PORT}`));
  } catch (err) {
    console.error("[server] Error al iniciar:", err.message);
    process.exit(1);
  }
}

start();
