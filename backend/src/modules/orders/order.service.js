import crypto from "node:crypto";
import { Product } from "../products/product.model.js";
import { Order } from "./order.model.js";
import { ApiError } from "../../middleware/errors.js";
export async function createOrder(input, customer, payments) {
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
    customerId: customer._id,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: input.phone,
    },
    items: mapped,
    total,
    pickupLocation: input.pickupLocation,
  });
  let result;
  try {
    result = await payments.initiate({
      phone: input.phone,
      amount: total,
      reference,
    });
  } catch (error) {
    order.paymentStatus = "failed";
    await order.save();
    throw error;
  }
  order.merchantRequestId = result.merchantRequestId;
  order.checkoutRequestId = result.checkoutRequestId;
  await order.save();
  return order;
}
