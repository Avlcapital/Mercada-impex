import { expect, test } from "vitest";
import { cookieOptions, hashPassword, verifyPassword } from "./auth.service.js";

test("uses production-secure cookie attributes and configured lifetime", () => {
  expect(
    cookieOptions({ NODE_ENV: "production", SESSION_TTL_DAYS: 7 }),
  ).toEqual(
    expect.objectContaining({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 7 * 86_400_000,
    }),
  );
});

test("rejects malformed password hashes safely", async () => {
  await expect(verifyPassword("password", "broken")).resolves.toBe(false);
  const hash = await hashPassword("correct-password");
  await expect(verifyPassword("correct-password", hash)).resolves.toBe(true);
});
