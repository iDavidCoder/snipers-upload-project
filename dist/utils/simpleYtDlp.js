/**
 * Versão simplificada temporária para evitar problemas de sintaxe
 */
import { spawn } from "child_process";
export async function simpleYtDlpDownload(options) {
    const { url, outputPath, format = 'mp3', quality = '0' } = options;
    const args = [
        "--no-warnings",
        "--no-check-certificate"
    ];
    if (format === 'mp3') {
        args.push("--extract-audio", "--audio-format", "mp3", "--audio-quality", quality);
    }
    if (outputPath) {
        args.push("--output", outputPath);
    }
    args.push(url);
    console.log('🎯 yt-dlp simples:', args);
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
                reject(new Error(`yt-dlp falhou (código ${code}): ${stderr}`));
            }
        });
        process.on("error", (error) => {
            reject(new Error(`Erro ao executar yt-dlp: ${error.message}`));
        });
    });
}
