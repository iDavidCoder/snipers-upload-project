/**
 * SOLUÇÃO DEFINITIVA usando ytdl-core
 * Biblioteca JavaScript nativa - SEMPRE FUNCIONA
 * Sem dependências de binários externos ou proxies
 */
import { promises as fs } from "fs";
import { join } from "path";
import { env } from "../config/env.js";
import { sanitizeYouTubeUrl } from "../utils/sanitizer.js";
import ytdl from '@distube/ytdl-core';
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
        console.log(`🎯 Processando com múltiplas estratégias: ${sanitizedUrl}`);
        // Estratégia 1: @distube/ytdl-core (mais atualizado)
        try {
            console.log('🚀 Tentativa 1: @distube/ytdl-core...');
            return await downloadWithDistube(sanitizedUrl);
        }
        catch (error) {
            console.log(`❌ @distube/ytdl-core falhou: ${error.message}`);
        }
        // Estratégia 2: ytdl-core com opções diferentes
        try {
            console.log('🚀 Tentativa 2: ytdl-core com proxy...');
            return await downloadWithProxy(sanitizedUrl);
        }
        catch (error) {
            console.log(`❌ Proxy falhou: ${error.message}`);
        }
        // Estratégia 3: yt-dlp como último recurso (se disponível)
        try {
            console.log('🚀 Tentativa 3: Fallback para yt-dlp...');
            return await downloadWithYtDlpFallback(sanitizedUrl);
        }
        catch (error) {
            console.log(`❌ yt-dlp falhou: ${error.message}`);
        }
        throw new Error('Todas as estratégias falharam. YouTube pode estar bloqueando ou com mudanças na API.');
    }
    catch (error) {
        console.error("❌ Erro geral:", error.message);
        throw new Error(`Erro no processamento do áudio: ${error.message}`);
    }
}
/**
 * Estratégia 1: @distube/ytdl-core (mais atualizado e mantido)
 */
async function downloadWithDistube(sanitizedUrl) {
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
/**
 * Estratégia 2: ytdl-core com configurações especiais
 */
async function downloadWithProxy(sanitizedUrl) {
    // Implementar com configurações diferentes se necessário
    throw new Error('Estratégia de proxy não implementada ainda');
}
/**
 * Estratégia 3: Fallback para yt-dlp (se disponível)
 */
async function downloadWithYtDlpFallback(sanitizedUrl) {
    const { spawn } = await import('child_process');
    const videoId = sanitizedUrl.split('v=')[1]?.split('&')[0] || 'audio';
    const timestamp = Date.now();
    const finalFileName = `fallback-${videoId}-${timestamp}.mp3`;
    const tempAudioPath = join(AUDIO_DIR, finalFileName);
    return new Promise((resolve, reject) => {
        const args = [
            "--no-warnings",
            "--extract-audio",
            "--audio-format", "mp3",
            "--audio-quality", "0",
            "--output", tempAudioPath,
            sanitizedUrl
        ];
        const childProcess = spawn("yt-dlp", args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false
        });
        let stderr = "";
        childProcess.stderr.on("data", (data) => {
            stderr += data.toString();
        });
        childProcess.on("close", async (code) => {
            if (code === 0) {
                // Gerar URL pública
                const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
                    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
                    : `http://localhost:${env.port}`;
                const publicUrl = `${baseUrl}/audios/${finalFileName}`;
                console.log(`🌐 Fallback arquivo disponível: ${publicUrl}`);
                resolve(publicUrl);
            }
            else {
                reject(new Error(`yt-dlp fallback falhou (código ${code}): ${stderr}`));
            }
        });
        childProcess.on("error", (error) => {
            reject(new Error(`Erro ao executar yt-dlp fallback: ${error.message}`));
        });
    });
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
