import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export class YouTubeAudioService {
  private downloadDir = './tmp';

  constructor() {
    this.ensureDownloadDir();
  }

  private async ensureDownloadDir() {
    try {
      await fs.access(this.downloadDir);
    } catch {
      await fs.mkdir(this.downloadDir, { recursive: true });
    }
  }

  async downloadAudio(url: string): Promise<{ filePath: string; fileName: string }> {
    const fileName = `audio_${Date.now()}.mp3`;
    const outputPath = path.join(this.downloadDir, fileName);

    try {
      // Para Railway - tentar com cookies do Chrome primeiro
      let command = `yt-dlp --cookies-from-browser chrome -x --audio-format mp3 --audio-quality 5 -o "${outputPath}" "${url}"`;
      
      console.log('Downloading with yt-dlp (with cookies):', command);
      
      try {
        await execAsync(command, { 
          timeout: 60000,
          env: { ...process.env }
        });
      } catch (cookieError) {
        console.warn('Cookie method failed, trying without cookies:', cookieError);
        // Fallback sem cookies
        command = `yt-dlp -x --audio-format mp3 --audio-quality 5 -o "${outputPath}" "${url}"`;
        await execAsync(command, { 
          timeout: 60000,
          env: { ...process.env }
        });
      }

      // Verificar se o arquivo foi criado
      await fs.access(outputPath);
      
      return {
        filePath: outputPath,
        fileName
      };

    } catch (error: any) {
      console.error('Error downloading audio:', error);
      throw new Error(`Failed to download audio: ${error.message}`);
    }
  }

  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      console.log('Cleaned up file:', filePath);
    } catch (error) {
      console.warn('Could not cleanup file:', filePath, error);
    }
  }
}

// Export da função original de upload do YouTube
import { youtube } from "../config/google.js";
import { env } from "../config/env.js";
import { createReadStream } from "fs";
import type { UploadResult } from "../types/index.js";

export async function uploadVideo(filePath: string, title: string): Promise<UploadResult> {
  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: { title, categoryId: env.youtube.categoryId, defaultLanguage: "pt-BR", defaultAudioLanguage: "pt-BR" },
      status: { privacyStatus: env.youtube.privacyStatus }
    },
    media: { body: createReadStream(filePath) }
  });
  const id = res.data.id as string;
  return { videoId: id, title, filePath };
}
