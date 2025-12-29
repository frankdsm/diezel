import { Hono } from "hono";
import { posts } from "./posts";
import { chat } from "./chat";

const app = new Hono();

// Health check
app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: Date.now(),
    uptime: process.uptime(),
  })
);

// Mount sub-routers
app.route("/posts", posts);
app.route("/chat", chat);

export default app;
