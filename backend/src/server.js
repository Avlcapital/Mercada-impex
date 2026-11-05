import { loadEnv } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { createDaraja } from "./modules/payments/daraja.service.js";
import { createMailer } from "./services/mailer.js";
import { createApp } from "./app.js";
async function start() {
  const env = loadEnv();
  await connectDb(env.MONGODB_URI);
  const app = createApp({
    env,
    payments: createDaraja(env),
    mailer: createMailer(env),
  });
  app.listen(env.PORT, () =>
    console.log(`Mercada API listening on ${env.PORT}`),
  );
}
start().catch((error) => {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
});
