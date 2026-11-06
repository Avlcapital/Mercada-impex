import { loadEnv } from "../config/env.js";
import { connectDb, disconnectDb } from "../config/db.js";
import { provisionCatalog } from "../modules/products/bootstrap.js";

async function seed() {
  const env = loadEnv();
  await connectDb(env.MONGODB_URI);
  await provisionCatalog();
  console.log("Johari Gin seeded.");
  await disconnectDb();
}

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
