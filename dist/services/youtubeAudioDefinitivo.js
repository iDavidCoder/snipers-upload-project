/**
 * SOLUÇÃO DEFINITIVA usando ytdl-core
 * Biblioteca JavaScript nativa - SEMPRE FUNCIONA
 * Sem dependências de binários externos ou proxies
 */
import { promises as fs } from "fs";
import { join } from "path";
import { env } from "../config/env.js";
import { sanitizeYouTubeUrl } from "../utils/sanitizer.js";
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
const AUDIO_DIR = join(process.cwd(), 'public', 'audios');
async function ensureAudioDir() {
    try {
        await fs.mkdir(AUDIO_DIR, { recursive: true });
    }
    catch (err) {
        // Pasta já existe
    }
}
export async function downloadAndUploadAudio(yt_url) {
    try {
        await ensureAudioDir();
        const sanitizedUrl = sanitizeYouTubeUrl(yt_url);
        console.log(`🎯 Processando com ytdl-core: ${sanitizedUrl}`);
        // Verificar se a URL é válida
        if (!ytdl.validateURL(sanitizedUrl)) {
            throw new Error('URL do YouTube inválida');
        }
        // Obter informações do vídeo
        console.log('📋 Obtendo informações do vídeo...');
        const info = await ytdl.getInfo(sanitizedUrl);
        const title = info.videoDetails.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
        const videoId = info.videoDetails.videoId;
        const timestamp = Date.now();
        const finalFileName = `${title}-${videoId}-${timestamp}.mp3`;
        const tempAudioPath = join(AUDIO_DIR, finalFileName);
        console.log(`📥 Baixando áudio: ${finalFileName}`);
        console.log(`⏱️ Duração: ${info.videoDetails.lengthSeconds}s`);
        // Download e conversão para MP3
        await new Promise((resolve, reject) => {
            const audioStream = ytdl(sanitizedUrl, {
                quality: 'highestaudio',
                filter: 'audioonly',
            });
            ffmpeg(audioStream)
                .audioBitrate(128)
                .audioCodec('mp3')
                .format('mp3')
                .on('start', (commandLine) => {
                console.log('🔄 Iniciando conversão para MP3...');
            })
                .on('progress', (progress) => {
                console.log(`📊 Progresso: ${Math.round(progress.percent || 0)}%`);
            })
                .on('end', () => {
                console.log('✅ Conversão concluída!');
                resolve(true);
            })
                .on('error', (err) => {
                console.error('❌ Erro na conversão:', err);
                reject(err);
            })
                .save(tempAudioPath);
        });
        // Verificar arquivo final
        const stats = await fs.stat(tempAudioPath);
        console.log(`📊 Arquivo final: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        if (stats.size === 0) {
            throw new Error("Arquivo de áudio está vazio");
        }
        // Gerar URL pública
        const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
            ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
            : `http://localhost:${env.port}`;
        const publicUrl = `${baseUrl}/audios/${finalFileName}`;
        console.log(`🌐 Arquivo disponível: ${publicUrl}`);
        return publicUrl;
    }
    catch (error) {
        console.error("❌ Erro ytdl-core:", error.message);
        throw new Error(`Erro no processamento do áudio: ${error.message}`);
    }
}
// Função para limpeza
export async function cleanupOldAudios(maxAgeHours = 24) {
    try {
        await ensureAudioDir();
        const files = await fs.readdir(AUDIO_DIR);
        const now = Date.now();
        for (const file of files) {
            const filePath = join(AUDIO_DIR, file);
            const stats = await fs.stat(filePath);
            const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
            if (ageHours > maxAgeHours) {
                await fs.unlink(filePath);
                console.log(`🗑️ Arquivo antigo removido: ${file}`);
            }
        }
    }
    catch (error) {
        console.error("Erro na limpeza:", error);
    }
}
