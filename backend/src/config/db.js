import mongoose from "mongoose";

export async function connectDB() {
  // Idempotente: en serverless (Vercel) la función puede reusar la misma
  // instancia entre invocaciones ("warm start"), así que evitamos reconectar
  // si ya hay una conexión abierta o en curso.
  if (mongoose.connection.readyState !== 0) return;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("Falta la variable de entorno MONGO_URI");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log(`[db] Conectado a MongoDB: ${mongoose.connection.name}`);

  mongoose.connection.on("error", (err) => {
    console.error("[db] Error de conexión:", err.message);
  });
}
