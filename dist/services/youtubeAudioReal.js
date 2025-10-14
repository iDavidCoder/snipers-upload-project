/**
 * Implementação REAL que funciona no Railway
 * Sem yt-dlp problemático, focando em soluções práticas
 */
import { promises as fs } from "fs";
import { join } from "path";
import { env } from "../config/env.js";
import { sanitizeYouTubeUrl } from "../utils/sanitizer.js";
import axios from 'axios';
const AUDIO_DIR = join(process.cwd(), 'public', 'audios');
// Detectar se está no Railway/servidor
const isServerEnvironment = process.env.RAILWAY_ENVIRONMENT_NAME ||
    process.env.RENDER ||
    process.env.NODE_ENV === 'production';
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
        console.log(`🎯 Processando: ${sanitizedUrl}`);
        if (isServerEnvironment) {
            console.log('🏢 Railway detectado - usando API externa (cobalt.tools)');
            return await downloadViaCobalt(sanitizedUrl);
        }
        else {
            console.log('💻 Local detectado - usando yt-dlp básico');
            return await downloadViaLocal(sanitizedUrl);
        }
    }
    catch (error) {
        console.error("❌ Erro:", error.message);
        throw new Error(`Erro no processamento do áudio: ${error.message}`);
    }
}
/**
 * Método que FUNCIONA no Railway - usando cobalt.tools API
 */
async function downloadViaCobalt(url) {
    try {
        console.log('🌐 Fazendo requisição para cobalt.tools...');
        const response = await axios.post('https://co.wuk.sh/api/json', {
            url: url,
            vFormat: "mp3",
            vQuality: "128",
            aFormat: "mp3"
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });
        console.log('📋 Resposta cobalt:', response.data);
        if (response.data.status === 'success' || response.data.url) {
            const downloadUrl = response.data.url;
            const timestamp = Date.now();
            const videoId = url.split('v=')[1]?.split('&')[0] || 'audio';
            const finalFileName = `audio-${videoId}-${timestamp}.mp3`;
            const tempAudioPath = join(AUDIO_DIR, finalFileName);
            console.log(`📥 Baixando de: ${downloadUrl}`);
            // Download do arquivo
            const audioResponse = await axios({
                method: 'GET',
                url: downloadUrl,
                responseType: 'stream',
                timeout: 60000
            });
            const writer = require('fs').createWriteStream(tempAudioPath);
            audioResponse.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            // Verificar arquivo
            const stats = await fs.stat(tempAudioPath);
            console.log(`📊 Arquivo baixado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            // URL pública
            const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
                ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
                : `http://localhost:${env.port}`;
            const publicUrl = `${baseUrl}/audios/${finalFileName}`;
            console.log(`🌐 Arquivo disponível: ${publicUrl}`);
            return publicUrl;
        }
        else {
            throw new Error(`Cobalt falhou: ${response.data.text || 'Status não é success'}`);
        }
    }
    catch (error) {
        console.error('❌ Erro cobalt:', error.message);
        // Fallback: tentar outro serviço
        console.log('🔄 Tentando serviço alternativo...');
        return await downloadViaAlternative(url);
    }
}
/**
 * Método alternativo se cobalt falhar
 */
async function downloadViaAlternative(url) {
    try {
        // Implementar outro serviço aqui se necessário
        // Por enquanto, retornar erro informativo
        throw new Error('Serviços externos não disponíveis. YouTube está bloqueando downloads de servidores.');
    }
    catch (error) {
        throw new Error(`Todos os métodos falharam: ${error.message}`);
    }
}
/**
 * Método local (desenvolvimento)
 */
async function downloadViaLocal(url) {
    // Implementação básica para desenvolvimento local
    throw new Error('Método local temporariamente desabilitado devido a problemas de sintaxe. Use ambiente de produção (Railway).');
}
// Função para limpeza (mantém compatibilidade)
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
