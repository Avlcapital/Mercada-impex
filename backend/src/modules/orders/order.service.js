import crypto from "node:crypto";
import { Product } from "../products/product.model.js";
import { Order } from "./order.model.js";
import { ApiError } from "../../middleware/errors.js";
export async function createOrder(input, payments) {
  const ids = input.items.map((x) => x.productId),
    products = await Product.find({ _id: { $in: ids }, active: true });
  if (products.length !== new Set(ids).size)
    throw new ApiError(400, "One or more products are unavailable.");
  const mapped = input.items.map((entry) => {
    const p = products.find((x) => String(x._id) === entry.productId);
    return {
      product: p._id,
      name: p.name,
      unitPrice: p.price,
      quantity: entry.quantity,
      lineTotal: p.price * entry.quantity,
    };
  });
  const total = mapped.reduce((s, x) => s + x.lineTotal, 0);
  const reference = `MI-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const order = await Order.create({
    reference,
    customer: input.customer,
    items: mapped,
    total,
    pickupLocation: input.pickupLocation,
  });
  const result = await payments.initiate({
    phone: input.customer.phone,
    amount: total,
    reference,
  });
  order.merchantRequestId = result.merchantRequestId;
  order.checkoutRequestId = result.checkoutRequestId;
  await order.save();
  return order;
}
