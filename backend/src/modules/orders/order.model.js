import mongoose from "mongoose";
const item = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: String,
    unitPrice: Number,
    quantity: Number,
    lineTotal: Number,
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    customer: { name: String, email: String, phone: String },
    items: [item],
    total: { type: Number, required: true },
    currency: { type: String, default: "KES" },
    pickupLocation: {
      type: String,
      enum: ["oro-kilimani"],
      default: "oro-kilimani",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    merchantRequestId: { type: String, index: true, sparse: true },
    checkoutRequestId: { type: String, index: true, sparse: true },
    receipt: String,
    providerResultCode: Number,
    callbackProcessedAt: Date,
  },
  { timestamps: true },
);
export const Order = mongoose.model("Order", schema);
