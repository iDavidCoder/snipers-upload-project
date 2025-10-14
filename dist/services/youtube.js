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
            // Estratégia para Railway - User-Agent real + headers
            const command = `yt-dlp ` +
                `--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36" ` +
                `--add-header "Accept-Language:en-US,en;q=0.9" ` +
                `--add-header "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" ` +
                `--sleep-interval 1 ` +
                `--max-sleep-interval 3 ` +
                `-x --audio-format mp3 --audio-quality 5 ` +
                `-o "${outputPath}" "${url}"`;
            console.log('Downloading with enhanced yt-dlp...');
            await execAsync(command, {
                timeout: 90000, // 90 segundos
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
            // Se ainda falhar, tentar estratégia alternativa
            if (error.message.includes('Sign in to confirm')) {
                console.log('Trying alternative extraction method...');
                try {
                    const altCommand = `yt-dlp ` +
                        `--extractor-args "youtube:player_client=web" ` +
                        `--user-agent "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" ` +
                        `-x --audio-format mp3 --audio-quality 5 ` +
                        `-o "${outputPath}" "${url}"`;
                    await execAsync(altCommand, {
                        timeout: 90000,
                        env: { ...process.env }
                    });
                    await fs.access(outputPath);
                    return {
                        filePath: outputPath,
                        fileName
                    };
                }
                catch (altError) {
                    console.error('Alternative method also failed:', altError);
                    throw new Error(`YouTube download failed - bot detection active. Try again in a few minutes.`);
                }
            }
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
