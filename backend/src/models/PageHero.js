import mongoose from "mongoose";

// Un documento por página (slug de ruta), con la imagen de fondo del hero
// cargada desde el admin. Si no hay documento para una página, el frontend
// usa un fondo por defecto acorde a la marca.
const pageHeroSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, unique: true, trim: true },
    backgroundImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

export default mongoose.model("PageHero", pageHeroSchema);
