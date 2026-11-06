import axios from "axios";
import { ApiError } from "../../middleware/errors.js";
const timestamp = () => {
  const d = new Date(),
    p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};
export function createDaraja(env, client = axios) {
  return {
    async initiate({ phone, amount, reference }) {
      const required = [
        "DARAJA_KEY",
        "DARAJA_SECRET",
        "MPESA_SHORTCODE",
        "MPESA_PASSKEY",
        "MPESA_CALLBACK_URL",
      ];
      if (required.some((k) => !env[k]))
        throw new ApiError(
          503,
          "M-Pesa is not configured. Please try again later.",
        );
      try {
        const auth = Buffer.from(
          `${env.DARAJA_KEY}:${env.DARAJA_SECRET}`,
        ).toString("base64");
        const token = await client.get(
          `${env.DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
          { headers: { Authorization: `Basic ${auth}` } },
        );
        const time = timestamp();
        const Password = Buffer.from(
          `${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${time}`,
        ).toString("base64");
        const { data } = await client.post(
          `${env.DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
          {
            BusinessShortCode: env.MPESA_SHORTCODE,
            Password,
            Timestamp: time,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phone,
            PartyB: env.MPESA_SHORTCODE,
            PhoneNumber: phone,
            CallBackURL: env.MPESA_CALLBACK_URL,
            AccountReference: reference,
            TransactionDesc: `Payment for ${reference}`,
          },
          { headers: { Authorization: `Bearer ${token.data.access_token}` } },
        );
        return {
          merchantRequestId: data.MerchantRequestID,
          checkoutRequestId: data.CheckoutRequestID,
        };
      } catch (error) {
        console.error(
          "Daraja initiation failed",
          error.response?.status || error.message,
        );
        throw new ApiError(
          502,
          "M-Pesa could not start the payment. Your order is saved; please retry.",
        );
      }
    },
  };
}
