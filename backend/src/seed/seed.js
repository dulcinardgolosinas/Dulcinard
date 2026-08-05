import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/db.js";
import mongoose from "mongoose";
import SiteConfig from "../models/SiteConfig.js";
import ShippingZone from "../models/ShippingZone.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

const branches = [
  {
    name: "Av. Belgrano",
    address: "Av. Belgrano 2149, S.M.T.",
    schedule: {
      weekdays: { label: "Lunes a Viernes", hours: "8:30 a 21 hs" },
      saturday: { label: "Sábado", hours: "9 a 13 y 17 a 20 hs" }
    },
    order: 1
  },
  {
    name: "Córdoba",
    address: "Córdoba 811, S.M.T.",
    schedule: {
      weekdays: { label: "Lunes a Viernes", hours: "9 a 13 y 17 a 21 hs" },
      saturday: { label: "Sábado", hours: "9 a 14 hs" }
    },
    order: 2
  },
  {
    name: "Av. Roca",
    address: "Av. Roca 1832",
    schedule: {
      weekdays: { label: "Lunes a Viernes", hours: "8:30 a 13 y 16:30 a 20 hs" },
      saturday: { label: "Sábado", hours: "8:30 a 13 y 17:30 a 19:30 hs" }
    },
    order: 3
  },
  {
    name: "Avellaneda",
    address: "Avellaneda 385, Concepción",
    schedule: {
      weekdays: { label: "Lunes a Viernes", hours: "8 a 12:30 y 17 a 21 hs" },
      saturday: { label: "Sábado", hours: "8 a 12:30 hs" }
    },
    order: 4
  }
];

const shippingZones = [
  { name: "San Miguel de Tucumán", cost: 80, minPurchaseAmount: 500 },
  { name: "Yerba Buena", cost: 80, minPurchaseAmount: 500 },
  { name: "Tafí Viejo", cost: 80, minPurchaseAmount: 500 },
  { name: "Concepción", cost: 80, minPurchaseAmount: 500 }
];

const categories = [
  { name: "Caramelos", description: "Caramelos duros, blandos y masticables por mayor" },
  { name: "Chocolates", description: "Tabletas, bombones y chocolatines" },
  { name: "Alfajores", description: "Alfajores individuales y en caja" },
  { name: "Chicles", description: "Chicles y bubble gum" },
  { name: "Snacks", description: "Papas fritas, palitos salados y snacks salados" },
  { name: "Bebidas", description: "Gaseosas, jugos y aguas saborizadas" },
  { name: "Galletitas", description: "Galletitas dulces y saladas" },
  { name: "Turrones y Barritas", description: "Turrones, barritas de cereal y maní" }
];

async function run() {
  await connectDB();

  console.log("[seed] Configurando SiteConfig...");
  await SiteConfig.deleteMany({});
  await SiteConfig.create({
    brandName: "Dulci-Nard Tucumán",
    instagram: "https://instagram.com/dulcinard_golosinas",
    whatsappNumber: "3814091213",
    whatsappMessage: "¡Hola! Quiero hacer un pedido a Dulci-Nard.",
    minPurchaseAmount: 500,
    defaultShippingCost: 80,
    freeShippingFrom: 0,
    deliveryEtaHours: 24,
    branches
  });

  console.log("[seed] Cargando zonas de envío...");
  await ShippingZone.deleteMany({});
  await ShippingZone.insertMany(shippingZones);

  console.log("[seed] Cargando categorías...");
  await Category.deleteMany({});
  const createdCategories = await Category.insertMany(categories);

  console.log("[seed] Cargando usuario admin...");
  await User.deleteOne({ email: process.env.ADMIN_EMAIL });
  await User.create({
    name: "Admin Dulci-Nard",
    email: process.env.ADMIN_EMAIL || "admin@dulcinard.com",
    password: process.env.ADMIN_PASSWORD || "cambiar-esta-password",
    role: "admin"
  });

  console.log("[seed] Cargando productos de ejemplo...");
  await Product.deleteMany({});
  const byName = (name) => createdCategories.find((c) => c.name === name)._id;

  const sampleProducts = [
    { name: "Caramelos Media Hora x150u", category: byName("Caramelos"), brand: "Arcor", price: 3200, unit: "display", stock: 40, featured: true },
    { name: "Chocolate Águila x24u", category: byName("Chocolates"), brand: "Águila", price: 8500, unit: "display", stock: 25, featured: true },
    { name: "Alfajor Jorgito Triple x24u", category: byName("Alfajores"), brand: "Jorgito", price: 9800, unit: "caja", stock: 30, featured: true },
    { name: "Chicles Bazooka x50u", category: byName("Chicles"), brand: "Bazooka", price: 4100, unit: "display", stock: 50 },
    { name: "Papas Lays x45g x18u", category: byName("Snacks"), brand: "Lays", price: 12500, unit: "caja", stock: 20, featured: true },
    { name: "Gaseosa Cola x2.25L x6u", category: byName("Bebidas"), brand: "Manaos", price: 7600, unit: "pack", stock: 35 },
    { name: "Galletitas Oreo x24u", category: byName("Galletitas"), brand: "Oreo", price: 11200, unit: "caja", stock: 22 },
    { name: "Turrón Arcor Maní x24u", category: byName("Turrones y Barritas"), brand: "Arcor", price: 6300, unit: "display", stock: 45 }
  ];

  await Product.insertMany(sampleProducts.map((p) => ({ ...p, minOrderQty: 1, unitsPerPack: 1, active: true })));

  console.log("[seed] Listo ✅");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] Error:", err);
  process.exit(1);
});
