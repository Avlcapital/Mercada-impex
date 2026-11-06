import crypto from "node:crypto";
import { promisify } from "node:util";
import { Session } from "./session.model.js";
const scrypt = promisify(crypto.scrypt);
export const normalizeEmail = (email) => email.trim().toLowerCase();
export const safeCustomer = (customer) => ({
  id: String(customer._id),
  name: customer.name,
  email: customer.email,
});
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  try {
    const [algorithm, salt, expected] = String(stored).split(":");
    if (
      algorithm !== "scrypt" ||
      !/^[a-f\d]{32}$/i.test(salt) ||
      !/^[a-f\d]{128}$/i.test(expected)
    )
      return false;
    const actual = await scrypt(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), actual);
  } catch {
    return false;
  }
}
export const tokenHash = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
export async function createSession(customerId, ttlDays = 30) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlDays * 86_400_000);
  await Session.create({ customerId, tokenHash: tokenHash(token), expiresAt });
  return { token, expiresAt };
}
export function cookieOptions(env) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: (env.SESSION_TTL_DAYS || 30) * 86_400_000,
  };
}
