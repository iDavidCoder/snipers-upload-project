import express from "express";
import pino from "pino";
import { env } from "./config/env.js";
import { webhook } from "./routes/webhook.js";
const app = express();
const logger = pino();
app.use(express.json({ limit: "10mb" }));
app.use("/webhook", webhook);
app.get("/health", (_, res) => res.json({ ok: true }));
app.listen(env.port, () => {
    logger.info({ port: env.port }, "server");
});
