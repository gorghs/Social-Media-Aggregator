import express from "express";
import cors from "cors";
import githubRoutes from "./routes/github";
import redditRoutes from "./routes/reddit";
import logger from "./logger";

const app = express();
app.use(cors());
app.use(express.json());

// health
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/github", githubRoutes);
app.use("/api/reddit", redditRoutes);

// basic error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error("Unhandled error: " + (err.stack || err.message || String(err)));
  res.status(500).json({ error: "internal_server_error" });
});

export default app;
