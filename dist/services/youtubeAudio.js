import { promises as fs } from "fs";
import { join } from "path";
import { env } from "../config/env.js";
import { sanitizeYouTubeUrl } from "../utils/sanitizer.js";
import { simpleYtDlpDownload } from "../utils/simpleYtDlp.js";
import { downloadViaExternalService as externalDownload, downloadFromExternalUrl } from "./externalDownload.js";
// Pasta para armazenar arquivos de áudio temporários
const AUDIO_DIR = join(process.cwd(), 'public', 'audios');
// Detectar se está rodando no Railway ou similar
const isServerEnvironment = process.env.RAILWAY_ENVIRONMENT_NAME ||
    process.env.RENDER ||
    process.env.VERCEL ||
    process.env.NODE_ENV === 'production';
// Garantir que a pasta existe
async function ensureAudioDir() {
    try {
        await fs.mkdir(AUDIO_DIR, { recursive: true });
    }
    catch (err) {
        // Pasta já existe, ignorar erro
    }
}
export async function downloadAndUploadAudio(yt_url) {
    let tempAudioPath;
    try {
        // Garantir que a pasta de áudios existe
        await ensureAudioDir();
        // Validar e sanitizar URL do YouTube
        const sanitizedUrl = sanitizeYouTubeUrl(yt_url);
        console.log(`🎯 Processando: ${sanitizedUrl}`);
        // Detectar ambiente e escolher método apropriado
        if (isServerEnvironment) {
            console.log('🏢 Ambiente de servidor detectado - usando serviço externo');
            return await downloadViaExternalServiceMethod(sanitizedUrl);
        }
        else {
            console.log('💻 Ambiente local detectado - usando yt-dlp direto');
            // Para ambiente local, usar o método original
            // Obter informações do vídeo
            console.log('📋 Obtendo informações do vídeo...');
            const title = 'audio'; // Simplificado por enquanto
            const videoId = sanitizedUrl.split('v=')[1]?.split('&')[0] || Math.random().toString(36).substring(7);
            const timestamp = Date.now();
            // Criar nome do arquivo final
            const finalFileName = `${title}-${videoId}-${timestamp}.mp3`;
            const tempAudioPath = join(AUDIO_DIR, finalFileName);
            console.log(`📥 Baixando áudio: ${finalFileName}`);
            // Fazer download do áudio
            await simpleYtDlpDownload({
                url: sanitizedUrl,
                outputPath: tempAudioPath,
                format: 'mp3',
                quality: '0'
            });
            // Verificar se o arquivo foi criado
            try {
                await fs.access(tempAudioPath);
                console.log(`✅ Arquivo criado: ${tempAudioPath}`);
            }
            catch {
                throw new Error("Arquivo de áudio não foi gerado");
            }
            // Verificar tamanho do arquivo
            const stats = await fs.stat(tempAudioPath);
            if (stats.size === 0) {
                throw new Error("Arquivo de áudio está vazio");
            }
            console.log(`📊 Arquivo válido: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            // Gerar URL pública
            const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
                ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
                : `http://localhost:${env.port}`;
            const publicUrl = `${baseUrl}/audios/${finalFileName}`;
            console.log(`🌐 Arquivo disponível: ${publicUrl}`);
            return publicUrl;
        }
    }
    catch (error) {
        console.error("❌ Erro no processamento:", error.message);
        // Limpar arquivo temporário em caso de erro
        if (tempAudioPath) {
            await fs.unlink(tempAudioPath).catch(() => { });
        }
        throw new Error(`Erro no processamento do áudio: ${error.message}`);
    }
}
/**
 * Método original com yt-dlp (para ambiente local)
 */
async function downloadViaYtDlp(sanitizedUrl) {
    // Simplificado para evitar problemas de sintaxe
    const title = 'audio';
    const videoId = sanitizedUrl.split('v=')[1]?.split('&')[0] || Math.random().toString(36).substring(7);
    const timestamp = Date.now();
    // Criar nome do arquivo final
    const finalFileName = `${title}-${videoId}-${timestamp}.mp3`;
    const tempAudioPath = join(AUDIO_DIR, finalFileName);
    console.log(`📥 Baixando áudio: ${finalFileName}`);
    // Fazer download do áudio
    await simpleYtDlpDownload({
        url: sanitizedUrl,
        outputPath: tempAudioPath,
        format: 'mp3',
        quality: '0'
    });
    // Verificar se o arquivo foi criado e gerar URL
    const stats = await fs.stat(tempAudioPath);
    console.log(`📊 Arquivo válido: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : `http://localhost:${env.port}`;
    const publicUrl = `${baseUrl}/audios/${finalFileName}`;
    console.log(`🌐 Arquivo disponível: ${publicUrl}`);
    return publicUrl;
}
/**
 * Método com serviço externo (para Railway/servidor)
 */
async function downloadViaExternalServiceMethod(sanitizedUrl) {
    try {
        console.log('🌐 Usando serviço externo para download...');
        const result = await externalDownload(sanitizedUrl);
        const timestamp = Date.now();
        const finalFileName = `${result.title || 'audio'}-${timestamp}.mp3`;
        const tempAudioPath = join(AUDIO_DIR, finalFileName);
        console.log(`📥 Baixando de serviço externo: ${finalFileName}`);
        await downloadFromExternalUrl(result.downloadUrl, tempAudioPath);
        // Verificar se o arquivo foi criado
        const stats = await fs.stat(tempAudioPath);
        console.log(`📊 Arquivo baixado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        // Gerar URL pública
        const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
            ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
            : `http://localhost:${env.port}`;
        const publicUrl = `${baseUrl}/audios/${finalFileName}`;
        console.log(`🌐 Arquivo disponível: ${publicUrl}`);
        return publicUrl;
    }
    catch (error) {
        console.log(`❌ Serviço externo falhou: ${error.message}`);
        throw error;
    }
}
// Função para limpar arquivos antigos
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
        console.warn("⚠️ Erro ao limpar arquivos antigos:", error);
    }
}
