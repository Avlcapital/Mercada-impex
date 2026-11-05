import { Order } from "../orders/order.model.js";
const item = (items, name) => items.find((x) => x.Name === name)?.Value;
export async function processCallback(payload) {
  const callback = payload?.Body?.stkCallback;
  if (!callback?.MerchantRequestID || typeof callback.ResultCode !== "number")
    return { recognized: false };
  const order = await Order.findOne({
    merchantRequestId: callback.MerchantRequestID,
  });
  if (!order) return { recognized: false };
  if (order.callbackProcessedAt) return { recognized: true, duplicate: true };
  order.providerResultCode = callback.ResultCode;
  order.paymentStatus = callback.ResultCode === 0 ? "paid" : "failed";
  if (callback.ResultCode === 0) {
    const items = callback.CallbackMetadata?.Item || [];
    order.receipt = item(items, "MpesaReceiptNumber") || order.receipt;
  }
  order.callbackProcessedAt = new Date();
  await order.save();
  return { recognized: true, order };
}
