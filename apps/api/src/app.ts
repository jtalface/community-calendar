import cors from "cors";
import express from "express";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { activitiesRouter } from "./routes/activities.js";
import { authRouter } from "./routes/auth.js";
import { carpoolsRouter } from "./routes/carpools.js";
import { childrenRouter } from "./routes/children.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { exportsRouter } from "./routes/exports.js";
import { friendsRouter } from "./routes/friends.js";

function isAllowedOrigin(origin: string) {
  if (origin === process.env.WEB_ORIGIN) return true;

  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();
  app.use(cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    }
  }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "kidcal-api" }));
  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", requireAuth, dashboardRouter);
  app.use("/api/children", requireAuth, childrenRouter);
  app.use("/api/activities", requireAuth, activitiesRouter);
  app.use("/api/friends", requireAuth, friendsRouter);
  app.use("/api/carpools", requireAuth, carpoolsRouter);
  app.use("/api/export", requireAuth, exportsRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
