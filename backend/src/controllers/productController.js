import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadMany, deleteMany } from "../utils/cloudinaryUpload.js";
import { CLOUDINARY_FOLDERS } from "../config/cloudinary.js";

export const listProducts = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    brand,
    unit,
    minPrice,
    maxPrice,
    featured,
    page = 1,
    limit = 24,
    sort = "-createdAt",
    all
  } = req.query;

  const filter = all === "true" ? {} : { active: true };

  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (unit) filter.unit = unit;
  if (featured === "true") filter.featured = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter)
  ]);

  res.json({
    items,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? { _id: idOrSlug } : { slug: idOrSlug };
  const product = await Product.findOne(query).populate("category", "name slug");
  if (!product) return res.status(404).json({ message: "Producto no encontrado" });
  res.json(product);
});

export const listBrands = asyncHandler(async (req, res) => {
  const brands = await Product.distinct("brand", { active: true, brand: { $ne: "" } });
  res.json(brands.sort());
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, brand, category, sku, price, unit, unitsPerPack, stock, minOrderQty, featured, active } =
    req.body;

  const product = new Product({
    name,
    description,
    brand,
    category,
    sku: sku || undefined,
    price,
    unit,
    unitsPerPack,
    stock,
    minOrderQty,
    featured,
    active
  });

  if (req.files?.length) {
    product.images = await uploadMany(req.files, CLOUDINARY_FOLDERS.products);
  }

  await product.save();
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Producto no encontrado" });

  const fields = [
    "name",
    "description",
    "brand",
    "category",
    "sku",
    "price",
    "unit",
    "unitsPerPack",
    "stock",
    "minOrderQty",
    "featured",
    "active"
  ];
  for (const field of fields) {
    if (req.body[field] === undefined) continue;
    product[field] = field === "sku" ? req.body[field] || undefined : req.body[field];
  }

  // removeImages: array de publicIds a borrar, enviado como JSON string desde el form
  if (req.body.removeImages) {
    const toRemove = JSON.parse(req.body.removeImages);
    if (toRemove.length) {
      await deleteMany(toRemove);
      product.images = product.images.filter((img) => !toRemove.includes(img.publicId));
    }
  }

  if (req.files?.length) {
    const uploaded = await uploadMany(req.files, CLOUDINARY_FOLDERS.products);
    product.images = [...product.images, ...uploaded];
  }

  await product.save();
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Producto no encontrado" });

  await deleteMany(product.images.map((img) => img.publicId));
  await product.deleteOne();
  res.json({ message: "Producto eliminado" });
});
