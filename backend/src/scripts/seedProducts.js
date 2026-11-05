import { loadEnv } from "../config/env.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { Product } from "../modules/products/product.model.js";
const product = {
  name: "Johari Gin",
  slug: "johari-gin",
  sku: "JOHARI-GIN-750",
  price: 5390,
  currency: "KES",
  shortDescription: "A premium Tanzanian gin crafted with heritage and pride.",
  description:
    "Johari, meaning “jewel” in Swahili, is a premium Tanzanian spirit crafted with local botanicals and African pride. Crisp, balanced and refreshing.",
  storySections: [
    { title: "Our Origins", text: "Born in the heart of Tanzania, Johari was created to delight the palate while telling a story of African pride and authentic tradition." },
    { title: "A Unique Blend", text: "Locally sourced juniper, cardamom, citrus peels, and native herbs create a crisp, balanced flavor, distilled in small batches with copper stills and pure mountain spring water." },
    { title: "Celebrating Africa", text: "Each sip celebrates Africa’s tradition, storytelling, resilience, and growing voice in the global craft beverage scene." },
    { title: "Global Recognition", text: "Johari has begun earning recognition beyond Tanzania, carrying Tanzanian identity into African capitals, international festivals, and the world of premium spirits." },
  ],
  images: [
    "/assets/johari1.jpg",
    "/assets/johari2.jpg",
    "/assets/johari3.jpg",
    "/assets/johari4.jpg",
  ],
  active: true,
};
async function seed() {
  const env = loadEnv();
  await connectDb(env.MONGODB_URI);
  await Product.findOneAndUpdate({ sku: product.sku }, product, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  console.log("Johari Gin seeded.");
  await disconnectDb();
}
seed().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
