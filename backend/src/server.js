import express from "express";
import cors from "cors";
import { PORT } from "./config.js";
import { loadAndIndexAll } from "./vectorStore.js";
import { initSchema } from "./db.js";
import { requireAuth } from "./middleware/auth.js";

import authRouter from "./routes/auth.js";
import chatRouter from "./routes/chat.js";
import devicesRouter from "./routes/devices.js";
import feedbackRouter from "./routes/feedback.js";
import visionRouter from "./routes/vision.js";
import statsRouter from "./routes/stats.js";
import documentsRouter from "./routes/documents.js";
import conversationsRouter from "./routes/conversations.js";

const app = express();

// Allow requests from the deployed frontend (Vercel) and local dev
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl requests (no origin header)
      if (!origin) return callback(null, true);
      // Allow all origins in development or if no FRONTEND_URL is set
      if (!process.env.FRONTEND_URL) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow all vercel.app subdomains automatically
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// ── Public routes (no auth required) ─────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Intelligent Product Support API" });
});
app.use("/api/auth", authRouter);

// ── Protected routes (valid JWT required) ────────────────────────────────────
app.use("/api/conversations", requireAuth, conversationsRouter);
app.use("/api/chat",          requireAuth, chatRouter);
app.use("/api/devices",       requireAuth, devicesRouter);
app.use("/api/feedback",      requireAuth, feedbackRouter);
app.use("/api/vision",        requireAuth, visionRouter);
app.use("/api/stats",         requireAuth, statsRouter);
app.use("/api/documents",     requireAuth, documentsRouter);

async function start() {
  try {
    await initSchema();
    await loadAndIndexAll();

    app.listen(PORT, () => {
      console.log(`🚀 Node.js Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
