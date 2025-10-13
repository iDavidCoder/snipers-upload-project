import { Router } from "express";
import { z } from "zod";
import pLimit from "p-limit";
import axios from "axios";
import { extractDriveId } from "../utils/extractDriveId.js";
import { listFolderVideos, downloadToTmp, getFileMeta } from "../services/drive.js";
import { uploadVideo } from "../services/youtube.js";
import { insertRequest } from "../services/supabase.js";
import { downloadAndUploadAudio } from "../services/youtubeAudio.js";
import { env } from "../config/env.js";
import type { ProcessPayload } from "../types/index.js";
import { unlink } from "fs/promises";
import { join } from "path";
import { sanitizeYouTubeUrl } from "../utils/sanitizer.js";

const schema = z.object({
  user_id: z.string().min(1),
  is_private: z.boolean().optional(),
  drive_url: z.string().min(1),
  request_id: z.string().optional()
});

const youtubeAudioSchema = z.object({
  yt_url: z.string().url().min(1)
});

const limit = pLimit(2);

export const webhook = Router();

webhook.post("/ingest", async (req, res) => {
  const parsed = schema.safeParse(req.body as ProcessPayload);
  if (!parsed.success) return res.status(400).json({ error: "payload inválido", details: parsed.error.flatten() });

  const { user_id, drive_url } = parsed.data;

  try {
    const { id, type } = extractDriveId(drive_url);
    const files = type === "folder" ? await listFolderVideos(id) : [await getFileMeta(id)];
    if (!files.length) return res.status(204).send();

    const results: { videoId: string; youtubeUrl: string; title: string }[] = [];

    for (const f of files) {
      // download, upload, persist, callback with concurrency control
      // but code must be without comments, so no inline notes
    }

    const tasks = files.map(f =>
      limit(async () => {
        const dl = await downloadToTmp(f.id, f.name);
        try {
          const up = await uploadVideo(dl.path, dl.title);
          const youtubeUrl = `https://www.youtube.com/watch?v=${up.videoId}`;
          await insertRequest(user_id, youtubeUrl);
          if (env.callbackUrl) {
            await axios.post(env.callbackUrl, {
              user_id,
              request: parsed.data.request_id || null,
              url: youtubeUrl,
              fromDrive: true
            });
          }
          results.push({ videoId: up.videoId, youtubeUrl, title: up.title });
          return true;
        } finally {
          await unlink(dl.path).catch(() => {});
        }
      })
    );

    const settled = await Promise.allSettled(tasks);
    const ok = settled.filter(s => s.status === "fulfilled").length;
    const fail = settled.length - ok;

    return res.status(ok ? 200 : 207).json({ processed: ok, failed: fail, items: results });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "erro interno" });
  }
});

webhook.post("/youtube-audio", async (req, res) => {
  const parsed = youtubeAudioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      error: "payload inválido", 
      details: parsed.error.flatten() 
    });
  }

  const { yt_url } = parsed.data;

  try {
    const audioUrl = await downloadAndUploadAudio(yt_url);
    return res.status(200).json({ 
      success: true, 
      audioUrl,
      message: "Áudio processado e enviado para Supabase Storage com sucesso"
    });
  } catch (e: any) {
    return res.status(500).json({ 
      error: e.message || "erro interno ao processar áudio" 
    });
  }
});

// Endpoint para testar yt-dlp diretamente
webhook.post("/test-ytdlp", async (req, res) => {
  const { spawn } = await import("child_process");
  
  try {
    const { yt_url } = req.body;
    
    if (!yt_url) {
      return res.status(400).json({ error: "yt_url é obrigatório" });
    }

    console.log(`Testando yt-dlp com URL: ${yt_url}`);

    const result = await new Promise<any>((resolve, reject) => {
      const ytdlp = spawn("yt-dlp", [
        "--dump-json",
        "--no-warnings",
        yt_url
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false, // Removido shell: true para evitar problemas de sintaxe
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let stdout = "";
      let stderr = "";
      
      ytdlp.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      
      ytdlp.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      ytdlp.on("close", (code) => {
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0
        });
      });

      ytdlp.on("error", (err) => {
        reject(new Error(`Erro ao executar yt-dlp: ${err.message}`));
      });
    });

    return res.json({
      success: result.success,
      exitCode: result.code,
      stdout: result.stdout,
      stderr: result.stderr,
      videoInfo: result.success ? JSON.parse(result.stdout) : null
    });

  } catch (e: any) {
    return res.status(500).json({ 
      error: e.message,
      stack: e.stack
    });
  }
});

// Endpoint para deletar arquivo de áudio após processamento
webhook.delete("/audio/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validar nome do arquivo para segurança
    if (!filename || !/^[a-zA-Z0-9\-_.]+\.mp3$/.test(filename)) {
      return res.status(400).json({ error: "Nome de arquivo inválido" });
    }
    
    const filePath = join(process.cwd(), "public", "audios", filename);
    
    await unlink(filePath);
    
    return res.json({ 
      success: true, 
      message: `Arquivo ${filename} removido com sucesso` 
    });
    
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      return res.status(404).json({ error: "Arquivo não encontrado" });
    }
    
    return res.status(500).json({ 
      error: e.message 
    });
  }
});