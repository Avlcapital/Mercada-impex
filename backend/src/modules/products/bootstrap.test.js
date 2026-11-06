import { beforeEach, expect, test, vi } from "vitest";
import { Product } from "./product.model.js";
import { provisionCatalog } from "./bootstrap.js";
import { johariProduct } from "./johari.fixture.js";

beforeEach(() => {
  vi.restoreAllMocks();
});

test("idempotently provisions the approved Johari catalog entry", async () => {
  const update = vi.spyOn(Product, "findOneAndUpdate").mockResolvedValue({
    ...johariProduct,
    _id: "product-1",
  });

  await provisionCatalog();
  await provisionCatalog();

  expect(update).toHaveBeenCalledTimes(2);
  expect(update).toHaveBeenCalledWith(
    { sku: johariProduct.sku },
    johariProduct,
    expect.objectContaining({ upsert: true, new: true }),
  );
});
