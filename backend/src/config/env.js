import "dotenv/config";
import { z } from "zod";
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  DARAJA_KEY: z.string().optional(),
  DARAJA_SECRET: z.string().optional(),
  MPESA_SHORTCODE: z.string().optional(),
  MPESA_PASSKEY: z.string().optional(),
  MPESA_CALLBACK_URL: z.string().url().optional(),
  DARAJA_BASE_URL: z.string().url().default("https://sandbox.safaricom.co.ke"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
});
export function loadEnv(source = process.env) {
  const parsed = schema.safeParse(source);
  if (!parsed.success)
    throw new Error(
      `Invalid environment configuration: ${parsed.error.issues.map((x) => x.path.join(".")).join(", ")}`,
    );
  return parsed.data;
}
