import { z } from "zod";
const phone = z
  .string()
  .regex(/^(?:254|0)7\d{8}$/, "Use a Kenyan mobile number.")
  .transform((v) => (v.startsWith("0") ? `254${v.slice(1)}` : v));
export const createOrderSchema = z.object({
  body: z.object({
    phone,
    items: z
      .array(
        z.object({
          productId: z.string().regex(/^[a-f\d]{24}$/i),
          quantity: z.number().int().min(1).max(12),
        }),
      )
      .min(1)
      .max(10),
    pickupLocation: z.literal("oro-kilimani"),
  }),
  params: z.object({}),
  query: z.object({}),
});
export const referenceSchema = z.object({
  body: z.any(),
  params: z.object({ reference: z.string().min(6).max(40) }),
  query: z.object({}),
});
