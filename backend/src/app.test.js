import { beforeEach, describe, expect, test, vi } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { Contact } from "./modules/contacts/contact.model.js";
import { Product } from "./modules/products/product.model.js";
import { Order } from "./modules/orders/order.model.js";
let app, product, savedOrder;
const payments = {
  initiate: vi
    .fn()
    .mockResolvedValue({
      merchantRequestId: "merchant-1",
      checkoutRequestId: "checkout-1",
    }),
};
const queryResult = (value) => ({
  select: () => ({ lean: async () => value }),
  lean: async () => value,
});
beforeEach(() => {
  vi.restoreAllMocks();
  product = {
    _id: "507f1f77bcf86cd799439011",
    name: "Johari Gin",
    slug: "johari-gin",
    sku: "JG",
    price: 5390,
    images: ["/assets/johari1.jpg"],
    active: true,
  };
  savedOrder = null;
  vi.spyOn(Product, "find").mockImplementation((query) =>
    query?._id ? Promise.resolve([product]) : queryResult([product]),
  );
  vi.spyOn(Contact, "create").mockImplementation(async (value) => value);
  vi.spyOn(Order, "create").mockImplementation(async (value) => {
    savedOrder = {
      ...value,
      paymentStatus: "pending",
      save: vi.fn().mockResolvedValue(undefined),
    };
    return savedOrder;
  });
  vi.spyOn(Order, "findOne").mockImplementation((query) =>
    query.reference ? queryResult(savedOrder) : Promise.resolve(savedOrder),
  );
  payments.initiate.mockReset().mockResolvedValue({
    merchantRequestId: "merchant-1",
    checkoutRequestId: "checkout-1",
  });
  app = createApp({
    env: { FRONTEND_ORIGIN: "http://localhost:5173" },
    payments,
    mailer: null,
  });
});
test("exposes health and catalog", async () => {
  expect((await request(app).get("/api/v1/health")).status).toBe(200);
  const response = await request(app).get("/api/v1/products");
  expect(response.body[0].price).toBe(5390);
});
test("validates contact fields and stores valid messages", async () => {
  expect(
    (
      await request(app)
        .post("/api/v1/contacts")
        .send({ name: "A", email: "bad" })
    ).status,
  ).toBe(400);
  expect(
    (
      await request(app)
        .post("/api/v1/contacts")
        .send({
          name: "Amina",
          email: "a@example.com",
          subject: "Trade",
          message: "Please contact me about trade.",
        })
    ).status,
  ).toBe(201);
});
test("ignores client totals and persists authoritative order total", async () => {
  const response = await request(app)
    .post("/api/v1/orders")
    .send({
      customer: { name: "Amina", email: "a@example.com", phone: "0712345678" },
      items: [{ productId: String(product._id), quantity: 2 }],
      pickupLocation: "oro-kilimani",
      total: 1,
    });
  expect(response.status).toBe(201);
  expect(response.body.total).toBe(10780);
  expect(savedOrder.total).toBe(10780);
  expect(payments.initiate).toHaveBeenCalledWith(
    expect.objectContaining({ amount: 10780, phone: "254712345678" }),
  );
});
test("returns persisted payment fields by order reference", async () => {
  savedOrder = { reference: "MI-STATUS-1", total: 5390, paymentStatus: "paid", receipt: "RCP123", pickupLocation: "oro-kilimani" };
  const response = await request(app).get("/api/v1/orders/MI-STATUS-1");
  expect(response.status).toBe(200);
  expect(response.body).toEqual(savedOrder);
});
describe("Daraja callbacks", () => {
  test("acknowledges unknown and malformed callbacks safely", async () => {
    savedOrder = null;
    expect(
      (await request(app).post("/api/v1/payments/callback").send({})).body
        .ResultCode,
    ).toBe(0);
    const unknown = {
      Body: { stkCallback: { MerchantRequestID: "missing", ResultCode: 0 } },
    };
    expect(
      (await request(app).post("/api/v1/payments/callback").send(unknown))
        .status,
    ).toBe(200);
  });
  test("applies successful callbacks idempotently", async () => {
    savedOrder = {
      paymentStatus: "pending",
      callbackProcessedAt: null,
      save: vi.fn().mockResolvedValue(undefined),
    };
    const payload = {
      Body: {
        stkCallback: {
          MerchantRequestID: "merchant-1",
          ResultCode: 0,
          CallbackMetadata: {
            Item: [{ Name: "MpesaReceiptNumber", Value: "RCP123" }],
          },
        },
      },
    };
    await request(app).post("/api/v1/payments/callback").send(payload);
    await request(app).post("/api/v1/payments/callback").send(payload);
    expect(savedOrder.paymentStatus).toBe("paid");
    expect(savedOrder.receipt).toBe("RCP123");
    expect(savedOrder.save).toHaveBeenCalledOnce();
  });
});
