import { Router } from "express";
import { z } from "zod";
import { Product } from "./products/product.model.js";
import { Contact } from "./contacts/contact.model.js";
import { Order } from "./orders/order.model.js";
import { validate } from "../middleware/validate.js";
import { asyncRoute, ApiError } from "../middleware/errors.js";
import { createOrderSchema, referenceSchema } from "./orders/order.schemas.js";
import { createOrder } from "./orders/order.service.js";
import { processCallback } from "./payments/callback.service.js";
import { authenticate } from "./auth/auth.middleware.js";
import { authRoutes } from "./auth/auth.routes.js";
const contactSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email(),
    subject: z.string().trim().min(3).max(150),
    message: z.string().trim().min(10).max(3000),
  }),
  params: z.object({}),
  query: z.object({}),
});
export function routes({ payments, mailer, env }) {
  const router = Router();
  router.use("/auth", authRoutes(env));
  router.get(
    "/products",
    asyncRoute(async (_req, res) =>
      res.json(await Product.find({ active: true }).select("-__v").lean()),
    ),
  );
  router.get(
    "/products/:slug",
    asyncRoute(async (req, res) => {
      const product = await Product.findOne({
        slug: req.params.slug,
        active: true,
      })
        .select("-__v")
        .lean();
      if (!product) throw new ApiError(404, "Product not found.");
      res.json(product);
    }),
  );
  router.post(
    "/orders",
    authenticate,
    validate(createOrderSchema),
    asyncRoute(async (req, res) => {
      const order = await createOrder(req.body, req.customer, payments);
      res.status(201).json({
        reference: order.reference,
        total: order.total,
        payment: { status: order.paymentStatus },
      });
    }),
  );
  router.get(
    "/orders",
    authenticate,
    asyncRoute(async (req, res) => {
      const orders = await Order.find({ customerId: req.customer._id })
        .sort({ createdAt: -1 })
        .select("reference total paymentStatus pickupLocation createdAt")
        .lean();
      res.json(orders);
    }),
  );
  router.get(
    "/orders/:reference",
    authenticate,
    validate(referenceSchema),
    asyncRoute(async (req, res) => {
      const order = await Order.findOne({
        reference: req.params.reference,
        customerId: req.customer._id,
      }).lean();
      if (!order) throw new ApiError(404, "Order not found.");
      res.json({
        reference: order.reference,
        total: order.total,
        paymentStatus: order.paymentStatus,
        receipt: order.receipt,
        pickupLocation: order.pickupLocation,
      });
    }),
  );
  router.post(
    "/payments/callback",
    asyncRoute(async (req, res) => {
      await processCallback(req.body);
      res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }),
  );
  router.post(
    "/contacts",
    validate(contactSchema),
    asyncRoute(async (req, res) => {
      const contact = await Contact.create(req.body);
      if (mailer)
        mailer
          .contact(contact)
          .catch((e) => console.error("Contact mail failed", e.message));
      res.status(201).json({ message: "Message received." });
    }),
  );
  return router;
}
