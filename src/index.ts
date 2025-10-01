import express from "express";
import pino from "pino";
import { join } from "path";
import { env } from "./config/env.js";
import { webhook } from "./routes/webhook.js";
import { cleanupOldAudios } from "./services/youtubeAudio.js";

const app = express();
const logger = pino();

app.use(express.json({ limit: "10mb" }));

// Servir arquivos de áudio estaticamente
app.use("/audios", express.static(join(process.cwd(), "public", "audios")));

app.use("/webhook", webhook);

app.get("/health", (_, res) => res.json({ ok: true }));

// Limpar arquivos antigos a cada hora
setInterval(() => {
  cleanupOldAudios(24); // Remove arquivos com mais de 24 horas
}, 60 * 60 * 1000);

app.listen(env.port, () => {
  logger.info({ port: env.port }, "server");
});
