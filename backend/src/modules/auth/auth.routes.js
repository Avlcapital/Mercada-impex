import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { Customer } from "../customers/customer.model.js";
import { Session } from "./session.model.js";
import { asyncRoute, ApiError } from "../../middleware/errors.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "./auth.middleware.js";
import {
  cookieOptions,
  createSession,
  hashPassword,
  normalizeEmail,
  safeCustomer,
  tokenHash,
  verifyPassword,
} from "./auth.service.js";
const empty = { params: z.object({}), query: z.object({}) };
const credentials = z.object({
  ...empty,
  body: z.object({
    email: z.string().email(),
    password: z.string().min(10).max(128),
  }),
});
const registration = z.object({
  ...empty,
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(10).max(128),
  }),
});
const dummyPasswordHash = hashPassword("generic-invalid-credential");
const readToken = (header = "") =>
  Object.fromEntries(
    header
      .split(";")
      .filter(Boolean)
      .map((x) => x.trim().split("=")),
  ).mercada_session;
export function authRoutes(env) {
  const router = Router();
  const credentialLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });
  const issue = async (res, customer) => {
    const session = await createSession(
      customer._id,
      env.SESSION_TTL_DAYS || 30,
    );
    res.cookie("mercada_session", session.token, cookieOptions(env));
    return safeCustomer(customer);
  };
  router.post(
    "/register",
    credentialLimiter,
    validate(registration),
    asyncRoute(async (req, res) => {
      const email = normalizeEmail(req.body.email);
      if (await Customer.exists({ email }))
        throw new ApiError(
          409,
          "Unable to create account with those credentials.",
        );
      try {
        const customer = await Customer.create({
          name: req.body.name,
          email,
          passwordHash: await hashPassword(req.body.password),
        });
        res.status(201).json({ customer: await issue(res, customer) });
      } catch (error) {
        if (error?.code === 11000)
          throw new ApiError(
            409,
            "Unable to create account with those credentials.",
          );
        throw error;
      }
    }),
  );
  router.post(
    "/login",
    credentialLimiter,
    validate(credentials),
    asyncRoute(async (req, res) => {
      const customer = await Customer.findOne({
        email: normalizeEmail(req.body.email),
      }).select("+passwordHash");
      const valid = await verifyPassword(
        req.body.password,
        customer?.passwordHash || (await dummyPasswordHash),
      );
      if (!customer || customer.disabled || !valid)
        throw new ApiError(401, "Invalid email or password.");
      res.json({ customer: await issue(res, customer) });
    }),
  );
  router.get("/me", authenticate, (req, res) =>
    res.json({ customer: safeCustomer(req.customer) }),
  );
  router.post(
    "/logout",
    asyncRoute(async (req, res) => {
      const token = readToken(req.headers.cookie);
      let revocationError;
      try {
        if (token)
          await Session.updateOne(
            { tokenHash: tokenHash(decodeURIComponent(token)) },
            { revokedAt: new Date() },
          );
      } catch (error) {
        revocationError = error;
      }
      const clearOptions = cookieOptions(env);
      delete clearOptions.maxAge;
      res.clearCookie("mercada_session", clearOptions);
      if (revocationError) throw revocationError;
      res.status(204).end();
    }),
  );
  return router;
}
