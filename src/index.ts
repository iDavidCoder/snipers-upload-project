import express from "express";
import pino from "pino";
import { join } from "path";
import { env } from "./config/env.js";
import { webhook } from "./routes/webhook.js";

const app = express();
const logger = pino();

app.use(express.json({ limit: "10mb" }));

// Servir arquivos estáticos da pasta public
app.use(express.static(join(process.cwd(), "public")));

app.use("/webhook", webhook);

app.get("/health", (_, res) => res.json({ ok: true }));

app.listen(env.port || 3000, "0.0.0.0", () => {
  logger.info({ port: env.port || 3000 }, "server");
});
