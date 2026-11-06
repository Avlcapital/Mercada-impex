import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "KES" },
    shortDescription: String,
    description: String,
    storySections: [{ title: String, text: String }],
    images: [String],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Product = mongoose.model("Product", schema);
