import { beforeEach, describe, expect, test, vi } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { Contact } from "./modules/contacts/contact.model.js";
import { Product } from "./modules/products/product.model.js";
import { Order } from "./modules/orders/order.model.js";
import { Session } from "./modules/auth/session.model.js";
import { Customer } from "./modules/customers/customer.model.js";
import { hashPassword } from "./modules/auth/auth.service.js";
let app, product, savedOrder;
const customer = {
  _id: "507f1f77bcf86cd799439012",
  name: "Amina",
  email: "a@example.com",
  disabled: false,
};
const payments = {
  initiate: vi.fn().mockResolvedValue({
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
  vi.spyOn(Customer, "exists").mockResolvedValue(false);
  vi.spyOn(Customer, "create").mockImplementation(async (value) => ({
    ...value,
    _id: customer._id,
  }));
  vi.spyOn(Session, "create").mockResolvedValue({});
  vi.spyOn(Session, "updateOne").mockResolvedValue({ modifiedCount: 1 });
  vi.spyOn(Session, "findOne").mockReturnValue({
    populate: async () => ({ customerId: customer }),
  });
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
  vi.spyOn(Order, "find").mockReturnValue({
    sort: () => ({
      select: () => ({ lean: async () => (savedOrder ? [savedOrder] : []) }),
    }),
  });
  payments.initiate.mockReset().mockResolvedValue({
    merchantRequestId: "merchant-1",
    checkoutRequestId: "checkout-1",
  });
  app = createApp({
    env: { FRONTEND_ORIGIN: "http://localhost:5173", NODE_ENV: "test" },
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
      await request(app).post("/api/v1/contacts").send({
        name: "Amina",
        email: "a@example.com",
        subject: "Trade",
        message: "Please contact me about trade.",
      })
    ).status,
  ).toBe(201);
});
test("registers, restores, logs in, and revokes cookie sessions", async () => {
  const registration = await request(app).post("/api/v1/auth/register").send({
    name: "Amina",
    email: "AMINA@example.com",
    password: "long-password-123",
  });
  expect(registration.status).toBe(201);
  expect(registration.headers["set-cookie"][0]).toMatch(
    /HttpOnly.*SameSite=Lax/i,
  );
  expect(registration.body.customer).not.toHaveProperty("passwordHash");

  const passwordHash = await hashPassword("long-password-123");
  vi.spyOn(Customer, "findOne").mockReturnValue({
    select: async () => ({ ...customer, passwordHash }),
  });
  const login = await request(app).post("/api/v1/auth/login").send({
    email: customer.email,
    password: "long-password-123",
  });
  expect(login.status).toBe(200);

  const restored = await request(app)
    .get("/api/v1/auth/me")
    .set("Cookie", "mercada_session=test-token");
  expect(restored.body.customer.email).toBe(customer.email);

  const logout = await request(app)
    .post("/api/v1/auth/logout")
    .set("Cookie", "mercada_session=test-token");
  expect(logout.status).toBe(204);
  expect(Session.updateOne).toHaveBeenCalledOnce();
});
test("rejects duplicate registration and generic invalid credentials", async () => {
  Customer.exists.mockResolvedValueOnce(true);
  const duplicate = await request(app).post("/api/v1/auth/register").send({
    name: "Amina",
    email: customer.email,
    password: "long-password-123",
  });
  expect(duplicate.status).toBe(409);

  vi.spyOn(Customer, "findOne").mockReturnValue({ select: async () => null });
  const invalid = await request(app).post("/api/v1/auth/login").send({
    email: customer.email,
    password: "wrong-password-123",
  });
  expect(invalid.status).toBe(401);
  expect(invalid.body.message).toBe("Invalid email or password.");
});
test("requires authentication for customer order endpoints", async () => {
  expect((await request(app).get("/api/v1/orders")).status).toBe(401);
  expect((await request(app).post("/api/v1/orders").send({})).status).toBe(401);
});
test.each(["expired", "revoked"])(
  "treats %s sessions as anonymous",
  async (kind) => {
    Session.findOne.mockReturnValueOnce({ populate: async () => null });
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", `mercada_session=${kind}-token`);
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authentication required.");
  },
);
test("treats a populated session for a disabled customer as anonymous", async () => {
  Session.findOne.mockReturnValueOnce({
    populate: async () => ({ customerId: { ...customer, disabled: true } }),
  });
  const response = await request(app)
    .get("/api/v1/auth/me")
    .set("Cookie", "mercada_session=disabled-token");
  expect(response.status).toBe(401);
  expect(response.body.message).toBe("Authentication required.");
});
test("ignores client totals and persists authoritative order total", async () => {
  const response = await request(app)
    .post("/api/v1/orders")
    .set("Cookie", "mercada_session=test-token")
    .send({
      phone: "0712345678",
      items: [{ productId: String(product._id), quantity: 2 }],
      pickupLocation: "oro-kilimani",
      total: 1,
    });
  expect(response.status).toBe(201);
  expect(response.body.total).toBe(10780);
  expect(savedOrder.total).toBe(10780);
  expect(String(savedOrder.customerId)).toBe(customer._id);
  expect(payments.initiate).toHaveBeenCalledWith(
    expect.objectContaining({ amount: 10780, phone: "254712345678" }),
  );
});
test("marks an order failed when payment initiation fails", async () => {
  payments.initiate.mockRejectedValueOnce(new Error("Daraja unavailable"));
  const response = await request(app)
    .post("/api/v1/orders")
    .set("Cookie", "mercada_session=test-token")
    .send({
      phone: "0712345678",
      items: [{ productId: String(product._id), quantity: 1 }],
      pickupLocation: "oro-kilimani",
    });
  expect(response.status).toBe(500);
  expect(savedOrder.paymentStatus).toBe("failed");
  expect(savedOrder.save).toHaveBeenCalledOnce();
});
test("returns persisted payment fields by order reference", async () => {
  savedOrder = {
    reference: "MI-STATUS-1",
    total: 5390,
    paymentStatus: "paid",
    receipt: "RCP123",
    pickupLocation: "oro-kilimani",
  };
  const response = await request(app)
    .get("/api/v1/orders/MI-STATUS-1")
    .set("Cookie", "mercada_session=test-token");
  expect(response.status).toBe(200);
  expect(response.body).toEqual(savedOrder);
  expect(Order.findOne).toHaveBeenCalledWith({
    reference: "MI-STATUS-1",
    customerId: customer._id,
  });
});
test("lists only authenticated customer orders and excludes legacy guests", async () => {
  savedOrder = {
    reference: "MI-OWNED-1",
    total: 5390,
    paymentStatus: "paid",
    createdAt: new Date(),
  };
  const response = await request(app)
    .get("/api/v1/orders")
    .set("Cookie", "mercada_session=test-token");
  expect(response.status).toBe(200);
  expect(Order.find).toHaveBeenCalledWith({ customerId: customer._id });
  expect(response.body).toHaveLength(1);
});
test("returns the same 404 for unknown or foreign order references", async () => {
  savedOrder = null;
  const response = await request(app)
    .get("/api/v1/orders/MI-FOREIGN-1")
    .set("Cookie", "mercada_session=test-token");
  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Order not found.");
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
