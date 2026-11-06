import { expect, test, vi } from "vitest";
import { start } from "./server.js";

test("connects, provisions, then listens", async () => {
  const order = [],
    listen = vi.fn(() => "server");
  const result = await start({
    loadEnv: () => ({ MONGODB_URI: "mongo", PORT: 5000 }),
    connectDb: async () => order.push("connect"),
    provisionCatalog: async () => order.push("provision"),
    createDaraja: vi.fn(),
    createMailer: vi.fn(),
    createApp: () => ({
      listen: (...args) => {
        order.push("listen");
        return listen(...args);
      },
    }),
  });
  expect(order).toEqual(["connect", "provision", "listen"]);
  expect(result).toBe("server");
});

test("does not listen when catalog provisioning fails", async () => {
  const listen = vi.fn();
  await expect(
    start({
      loadEnv: () => ({ MONGODB_URI: "mongo", PORT: 5000 }),
      connectDb: vi.fn(),
      provisionCatalog: async () => {
        throw new Error("bootstrap");
      },
      createApp: () => ({ listen }),
      createDaraja: vi.fn(),
      createMailer: vi.fn(),
    }),
  ).rejects.toThrow("bootstrap");
  expect(listen).not.toHaveBeenCalled();
});
