import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export const Customer = mongoose.model("Customer", schema);
