import { Product } from "./product.model.js";
import { johariProduct } from "./johari.fixture.js";

export function provisionCatalog() {
  return Product.findOneAndUpdate({ sku: johariProduct.sku }, johariProduct, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
}
