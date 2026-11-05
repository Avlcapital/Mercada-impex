import express from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { routes } from "./modules/routes.js";
import { notFound, errorHandler } from "./middleware/errors.js";
export function createApp(deps) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({ origin: deps.env.FRONTEND_ORIGIN.split(",").map((x) => x.trim()) }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(
    "/api/v1",
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/v1", routes(deps));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
