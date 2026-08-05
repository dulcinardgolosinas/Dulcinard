// Entrypoint serverless para Vercel. Express no corre con app.listen() en
// este entorno: cada request invoca esta función, que conecta a Mongo
// (si hace falta) y delega en la app de Express ya armada en src/app.js.
import "dotenv/config";
import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
