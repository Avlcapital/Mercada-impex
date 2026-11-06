import { expect, test, vi } from "vitest";
import { createDaraja } from "./daraja.service.js";
test("fails clearly when credentials are missing", async () => {
  const service = createDaraja({});
  await expect(service.initiate({})).rejects.toMatchObject({
    status: 503,
    message: expect.stringContaining("not configured"),
  });
});
const env = {
  DARAJA_KEY: "key",
  DARAJA_SECRET: "secret",
  MPESA_SHORTCODE: "123456",
  MPESA_PASSKEY: "pass",
  MPESA_CALLBACK_URL: "https://shop.example/api/v1/payments/callback",
  DARAJA_BASE_URL: "https://sandbox.safaricom.co.ke",
};
test("sends the OAuth and STK request contract", async () => {
  const client = {
    get: vi.fn().mockResolvedValue({ data: { access_token: "token" } }),
    post: vi.fn().mockResolvedValue({
      data: { MerchantRequestID: "merchant", CheckoutRequestID: "checkout" },
    }),
  };
  const result = await createDaraja(env, client).initiate({
    phone: "254712345678",
    amount: 5390,
    reference: "MI-1",
  });
  expect(client.get).toHaveBeenCalledWith(
    expect.stringContaining("/oauth/v1/generate?grant_type=client_credentials"),
    expect.objectContaining({
      headers: {
        Authorization: `Basic ${Buffer.from("key:secret").toString("base64")}`,
      },
    }),
  );
  expect(client.post).toHaveBeenCalledWith(
    expect.stringContaining("/mpesa/stkpush/v1/processrequest"),
    expect.objectContaining({
      BusinessShortCode: "123456",
      Amount: 5390,
      PartyA: "254712345678",
      PhoneNumber: "254712345678",
      CallBackURL: env.MPESA_CALLBACK_URL,
      AccountReference: "MI-1",
    }),
    { headers: { Authorization: "Bearer token" } },
  );
  expect(result).toEqual({
    merchantRequestId: "merchant",
    checkoutRequestId: "checkout",
  });
});
test("translates provider errors to a safe 502", async () => {
  const client = {
    get: vi.fn().mockRejectedValue(new Error("provider secret detail")),
  };
  await expect(
    createDaraja(env, client).initiate({
      phone: "254712345678",
      amount: 5390,
      reference: "MI-1",
    }),
  ).rejects.toMatchObject({
    status: 502,
    message: expect.stringContaining("could not start"),
  });
});
