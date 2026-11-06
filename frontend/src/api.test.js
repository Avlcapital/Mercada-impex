import { beforeEach, expect, test, vi } from "vitest";
import { request } from "./api";

beforeEach(() => {
  global.fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
});

test.each([
  ["GET", {}],
  ["POST", { method: "POST", body: "{}", headers: { "X-Test": "yes" } }],
])(
  "uses credentialed %s requests while preserving options",
  async (_name, options) => {
    await request("/test", options);
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/test",
      expect.objectContaining({
        ...options,
        credentials: "include",
        headers: expect.objectContaining(options.headers || {}),
      }),
    );
  },
);

test("notifies the session provider on 401", async () => {
  const listener = vi.fn();
  window.addEventListener("mercada:unauthorized", listener);
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 401,
    json: async () => ({ message: "No" }),
  });
  await expect(request("/private")).rejects.toMatchObject({ status: 401 });
  expect(listener).toHaveBeenCalledOnce();
});
