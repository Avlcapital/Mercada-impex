import { loadEnv } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { createDaraja } from "./modules/payments/daraja.service.js";
import { createMailer } from "./services/mailer.js";
import { createApp } from "./app.js";
import { provisionCatalog } from "./modules/products/bootstrap.js";
import { fileURLToPath } from "node:url";
export async function start(deps = {}) {
  const env = (deps.loadEnv || loadEnv)();
  await (deps.connectDb || connectDb)(env.MONGODB_URI);
  await (deps.provisionCatalog || provisionCatalog)();
  const app = (deps.createApp || createApp)({
    env,
    payments: (deps.createDaraja || createDaraja)(env),
    mailer: (deps.createMailer || createMailer)(env),
  });
  return app.listen(env.PORT, () =>
    console.log(`Mercada API listening on ${env.PORT}`),
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  start().catch((error) => {
    console.error(`Startup failed: ${error.message}`);
    process.exit(1);
  });
