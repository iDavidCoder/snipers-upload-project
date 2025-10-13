/**
 * Método alternativo simples para downloads do YouTube
 * Usa configurações mínimas que funcionam consistentemente
 */
import { spawn } from "child_process";
/**
 * Download simples e robusto sem headers complexos
 */
export async function simpleYtDlpDownload(options) {
    const { url, outputPath, format = 'mp3', quality = '0' } = options;
    // Argumentos mínimos e seguros
    const args = [
        "--no-warnings",
        "--no-check-certificate",
        "--prefer-insecure"
    ];
    if (format === 'mp3') {
        args.push("--extract-audio", "--audio-format", "mp3", "--audio-quality", quality);
    }
    if (outputPath) {
        args.push("--output", outputPath);
    }
    args.push(url);
    console.log('Executando yt-dlp simples com args:', args);
    return new Promise((resolve, reject) => {
        const process = spawn("yt-dlp", args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false
        });
        let stdout = "";
        let stderr = "";
        process.stdout.on("data", (data) => {
            stdout += data.toString();
        });
        process.stderr.on("data", (data) => {
            stderr += data.toString();
        });
        process.on("close", (code) => {
            if (code === 0) {
                resolve(stdout);
            }
            else {
                reject(new Error(`yt-dlp falhou com código ${code}: ${stderr}`));
            }
        });
        process.on("error", (error) => {
            reject(new Error(`Erro ao executar yt-dlp: ${error.message}`));
        });
    });
}
/**
 * Obter informações do vídeo de forma simples
 */
export async function simpleYtDlpInfo(url) {
    const args = [
        "--dump-json",
        "--no-warnings",
        "--no-check-certificate",
        url
    ];
    console.log('Obtendo info com yt-dlp simples:', args);
    return new Promise((resolve, reject) => {
        const process = spawn("yt-dlp", args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false
        });
        let stdout = "";
        let stderr = "";
        process.stdout.on("data", (data) => {
            stdout += data.toString();
        });
        process.stderr.on("data", (data) => {
            stderr += data.toString();
        });
        process.on("close", (code) => {
            if (code === 0) {
                try {
                    const info = JSON.parse(stdout);
                    resolve(info);
                }
                catch (e) {
                    reject(new Error("Falha ao parsear informações do vídeo"));
                }
            }
            else {
                reject(new Error(`yt-dlp info falhou: ${stderr}`));
            }
        });
        process.on("error", (error) => {
            reject(new Error(`Erro ao obter info: ${error.message}`));
        });
    });
}
