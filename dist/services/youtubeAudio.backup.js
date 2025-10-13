import { spawn } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";
import { env } from "../config/env.js";
import { getYtDlpArgs } from "../utils/cookies.js";
import { sanitizeYouTubeUrl } from "../utils/sanitizer.js";
// Pasta para armazenar arquivos de áudio temporários
const AUDIO_DIR = join(process.cwd(), 'public', 'audios');
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
        console.log(`URL sanitizada: ${sanitizedUrl}`);
        // Não tentar mais usar cookies - usar método otimizado sem cookies
        console.log('Usando método otimizado sem cookies para evitar problemas');
        // Primeiro, obter metadados do vídeo
        console.log(`Obtendo informações do vídeo: ${yt_url}`);
        const baseInfoArgs = [
            "--dump-json",
            sanitizedUrl
        ];
        const infoArgs = await getYtDlpArgs(baseInfoArgs);
        const videoInfo = await new Promise((resolve, reject) => {
            console.log('Executando yt-dlp com args:', infoArgs);
            const ytdlp = spawn("yt-dlp", infoArgs, {
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
                if (code !== 0) {
                    reject(new Error(`Falha ao obter informações do vídeo: ${stderr}`));
                    return;
                }
                try {
                    const info = JSON.parse(stdout);
                    resolve(info);
                }
                catch (e) {
                    reject(new Error("Falha ao parsear informações do vídeo"));
                }
            });
            ytdlp.on("error", (err) => {
                reject(new Error(`Erro ao executar yt-dlp: ${err.message}`));
            });
        });
        const title = videoInfo.title?.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50) || 'audio';
        const videoId = videoInfo.id || Math.random().toString(36).substring(7);
        const timestamp = Date.now();
        // Criar nome do arquivo final (agora pode ser MP3 já que ffmpeg está instalado)
        const finalFileName = `${title}-${videoId}-${timestamp}.mp3`;
        tempAudioPath = join(AUDIO_DIR, finalFileName);
        console.log(`Baixando áudio para: ${tempAudioPath}`);
        // Agora baixar o áudio e converter para MP3 (ffmpeg disponível)
        const baseDownloadArgs = [
            "--extract-audio",
            "--audio-format", "mp3",
            "--audio-quality", "0",
            "--no-playlist",
            "--output", tempAudioPath,
            sanitizedUrl
        ];
        const downloadArgs = await getYtDlpArgs(baseDownloadArgs);
        await new Promise((resolve, reject) => {
            console.log('Executando yt-dlp download com args:', downloadArgs);
            const ytdlp = spawn("yt-dlp", downloadArgs, {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: false, // Removido shell: true para evitar problemas de sintaxe
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
            });
            let stderr = "";
            let stdout = "";
            ytdlp.stdout.on("data", (data) => {
                const output = data.toString();
                stdout += output;
                console.log("yt-dlp stdout:", output.trim());
            });
            ytdlp.stderr.on("data", (data) => {
                const output = data.toString();
                stderr += output;
                console.log("yt-dlp stderr:", output.trim());
            });
            ytdlp.on("close", (code) => {
                console.log(`yt-dlp download exited with code: ${code}`);
                if (code !== 0) {
                    reject(new Error(`Falha no download do áudio (código ${code}): ${stderr}`));
                    return;
                }
                resolve();
            });
            ytdlp.on("error", (err) => {
                reject(new Error(`Erro ao executar yt-dlp: ${err.message}`));
            });
        });
        // Verificar se o arquivo foi criado
        try {
            await fs.access(tempAudioPath);
            console.log(`Arquivo criado com sucesso: ${tempAudioPath}`);
        }
        catch {
            throw new Error("Arquivo de áudio não foi gerado");
        }
        // Verificar tamanho do arquivo
        const stats = await fs.stat(tempAudioPath);
        if (stats.size === 0) {
            throw new Error("Arquivo de áudio está vazio");
        }
        console.log(`Arquivo válido: ${stats.size} bytes`);
        // Gerar URL pública para servir o arquivo diretamente
        const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
            ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
            : `http://localhost:${env.port}`;
        const publicUrl = `${baseUrl}/audios/${finalFileName}`;
        console.log(`Arquivo disponível em: ${publicUrl}`);
        return publicUrl;
    }
    catch (error) {
        console.error("Erro geral:", error);
        // Limpar arquivo temporário em caso de erro
        if (tempAudioPath) {
            await fs.unlink(tempAudioPath).catch(() => { });
        }
        throw new Error(`Erro no processamento do áudio: ${error.message}`);
    }
}
// Função para limpar arquivos antigos (opcional, pode ser chamada periodicamente)
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
                console.log(`Arquivo antigo removido: ${file}`);
            }
        }
    }
    catch (error) {
        console.warn("Erro ao limpar arquivos antigos:", error);
    }
}
