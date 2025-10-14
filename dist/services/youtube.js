import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
const execAsync = promisify(exec);
export class YouTubeAudioService {
    downloadDir = './tmp';
    constructor() {
        this.ensureDownloadDir();
    }
    async ensureDownloadDir() {
        try {
            await fs.access(this.downloadDir);
        }
        catch {
            await fs.mkdir(this.downloadDir, { recursive: true });
        }
    }
    async downloadAudio(url) {
        const fileName = `audio_${Date.now()}.mp3`;
        const outputPath = path.join(this.downloadDir, fileName);
        try {
            // Usar cookies.txt que está no projeto
            const cookiesPath = path.join(process.cwd(), 'src', 'cookies', 'cookies.txt');
            const command = `yt-dlp ` +
                `--cookies "${cookiesPath}" ` +
                `--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36" ` +
                `-x --audio-format mp3 --audio-quality 5 ` +
                `-o "${outputPath}" "${url}"`;
            console.log('Downloading with yt-dlp using cookies...');
            await execAsync(command, {
                timeout: 90000,
                env: { ...process.env }
            });
            // Verificar se o arquivo foi criado
            await fs.access(outputPath);
            return {
                filePath: outputPath,
                fileName
            };
        }
        catch (error) {
            console.error('Error downloading audio:', error);
            throw new Error(`Failed to download audio: ${error.message}`);
        }
    }
    async cleanupFile(filePath) {
        try {
            await fs.unlink(filePath);
            console.log('Cleaned up file:', filePath);
        }
        catch (error) {
            console.warn('Could not cleanup file:', filePath, error);
        }
    }
}
// Export da função original de upload do YouTube
import { youtube } from "../config/google.js";
import { env } from "../config/env.js";
import { createReadStream } from "fs";
export async function uploadVideo(filePath, title) {
    const res = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
            snippet: { title, categoryId: env.youtube.categoryId, defaultLanguage: "pt-BR", defaultAudioLanguage: "pt-BR" },
            status: { privacyStatus: env.youtube.privacyStatus }
        },
        media: { body: createReadStream(filePath) }
    });
    const id = res.data.id;
    return { videoId: id, title, filePath };
}
