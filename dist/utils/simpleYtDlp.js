/**
 * Método alternativo simples para downloads do YouTube
 * Usa configurações mínimas que funcionam consistentemente
 */
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
/**
 * Helper para adicionar cookies se existir
 */
function addCookiesIfAvailable(args) {
    // Para compatibilidade com ES modules, usar import.meta.url se disponível
    let currentDir = process.cwd();
    try {
        // Em ES modules, __dirname não existe, então criamos um equivalente
        if (typeof __dirname === 'undefined') {
            currentDir = process.cwd();
        }
        else {
            currentDir = __dirname;
        }
    }
    catch {
        currentDir = process.cwd();
    }
    const cookiesPaths = [
        "src/cookies/cookies.txt",
        "./src/cookies/cookies.txt",
        path.join(process.cwd(), "src", "cookies", "cookies.txt"),
        path.join(currentDir, "..", "..", "cookies", "cookies.txt"),
        path.join(process.cwd(), "dist", "..", "src", "cookies", "cookies.txt")
    ];
    for (const cookiesPath of cookiesPaths) {
        if (fs.existsSync(cookiesPath)) {
            // Verificar se o arquivo não está vazio e tem conteúdo válido
            try {
                const content = fs.readFileSync(cookiesPath, 'utf-8');
                const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
                if (lines.length > 0) {
                    args.push("--cookies", cookiesPath);
                    console.log(`✅ Usando cookies: ${cookiesPath} (${lines.length} cookies válidos)`);
                    // Verificar se há cookies do YouTube especificamente
                    const youtubeCookies = lines.filter(line => line.includes('youtube.com') || line.includes('.youtube.com'));
                    if (youtubeCookies.length > 0) {
                        console.log(`📺 Encontrados ${youtubeCookies.length} cookies do YouTube`);
                    }
                    else {
                        console.log(`⚠️ Nenhum cookie específico do YouTube encontrado`);
                    }
                    return true;
                }
                else {
                    console.log(`⚠️ Cookies encontrado mas vazio: ${cookiesPath}`);
                }
            }
            catch (err) {
                console.log(`❌ Erro ao ler cookies: ${cookiesPath}`, err);
            }
        }
    }
    console.log("⚠️ Nenhum cookies.txt válido encontrado nos caminhos:", cookiesPaths);
    console.log("📁 Diretório atual:", process.cwd());
    console.log("📁 currentDir:", currentDir);
    return false;
}
/**
 * Download com estratégias anti-detecção progressivas
 */
export async function simpleYtDlpDownload(options) {
    const { url, outputPath, format = 'mp3', quality = '0' } = options;
    // Estratégia 1: Método básico
    let args = [
        "--no-warnings",
        "--no-check-certificate",
        "--prefer-insecure"
    ];
    // Usar cookies.txt se existir
    addCookiesIfAvailable(args);
    if (format === 'mp3') {
        args.push("--extract-audio", "--audio-format", "mp3", "--audio-quality", quality);
    }
    if (outputPath) {
        args.push("--output", outputPath);
    }
    args.push(url);
    console.log('🎯 Download - Tentativa 1 (básico):', args);
    try {
        return await executeYtDlpDownload(args);
    }
    catch (error) {
        console.log('❌ Download básico falhou, usando anti-detecção...');
        // Estratégia 2: Anti-detecção
        args = [
            "--no-warnings",
            "--no-check-certificate",
            "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "--add-header", "Accept-Language:en-US,en;q=0.9",
            "--extractor-retries", "3",
            "--sleep-interval", "2"
        ];
        // Usar cookies também na segunda tentativa
        addCookiesIfAvailable(args);
        if (format === 'mp3') {
            args.push("--extract-audio", "--audio-format", "mp3", "--audio-quality", quality);
        }
        if (outputPath) {
            args.push("--output", outputPath);
        }
        args.push(url);
        console.log('🛡️ Download - Tentativa 2 (anti-detecção):', args);
        return await executeYtDlpDownload(args);
    }
}
/**
 * Função helper para executar download
 */
function executeYtDlpDownload(args) {
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
                reject(new Error(`yt-dlp download falhou (código ${code}): ${stderr}`));
            }
        });
        process.on("error", (error) => {
            reject(new Error(`Erro no download: ${error.message}`));
        });
    });
}
/**
 * Obter informações do vídeo com estratégias anti-detecção para servidores
 */
export async function simpleYtDlpInfo(url) {
    // Estratégia 1: Método básico (funciona localmente)
    let args = [
        "--dump-json",
        "--no-warnings",
        "--no-check-certificate"
    ];
    // Adicionar cookies se disponível
    addCookiesIfAvailable(args);
    args.push(url);
    console.log('🎯 Tentativa 1 - Método básico:', args);
    try {
        return await executeYtDlp(args);
    }
    catch (error) {
        console.log('❌ Método básico falhou, tentando anti-detecção avançada...');
        // Estratégia 2: Anti-detecção para servidores
        args = [
            "--dump-json",
            "--no-warnings",
            "--no-check-certificate",
            "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "--add-header", "Accept-Language:en-US,en;q=0.9",
            "--add-header", "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "--extractor-retries", "3",
            "--sleep-interval", "2",
            "--max-sleep-interval", "5"
        ];
        // Adicionar cookies se disponível  
        addCookiesIfAvailable(args);
        args.push(url);
        console.log('🛡️ Tentativa 2 - Anti-detecção:', args);
        try {
            return await executeYtDlp(args);
        }
        catch (error2) {
            console.log('❌ Anti-detecção falhou, tentando método com proxy/VPN simulation...');
            // Estratégia 3: Simular diferentes origens
            args = [
                "--dump-json",
                "--no-warnings",
                "--no-check-certificate",
                "--user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
                "--add-header", "Accept-Language:pt-BR,pt;q=0.9,en;q=0.8",
                "--add-header", "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "--add-header", "Cache-Control:no-cache",
                "--extractor-retries", "5",
                "--sleep-interval", "3",
                "--max-sleep-interval", "8",
                "--geo-bypass"
            ];
            // Adicionar cookies se disponível
            addCookiesIfAvailable(args);
            args.push(url);
            console.log('🌍 Tentativa 3 - Simulação geográfica:', args);
            try {
                return await executeYtDlp(args);
            }
            catch (error3) {
                console.log('❌ Simulação geográfica falhou, tentando sem cookies como último recurso...');
                // Estratégia 4: Sem cookies, máxima agressividade anti-detecção
                args = [
                    "--dump-json",
                    "--no-warnings",
                    "--no-check-certificate",
                    "--user-agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "--add-header", "Accept-Language:en-US,en;q=0.5",
                    "--add-header", "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "--add-header", "Cache-Control:no-cache",
                    "--add-header", "DNT:1",
                    "--extractor-retries", "10",
                    "--sleep-interval", "5",
                    "--max-sleep-interval", "15",
                    "--geo-bypass",
                    "--force-ipv4",
                    url
                ];
                console.log('🔓 Tentativa 4 - Sem cookies (modo público):', args);
                return await executeYtDlp(args);
            }
        }
    }
}
/**
 * Função helper para executar yt-dlp
 */
function executeYtDlp(args) {
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
                reject(new Error(`yt-dlp falhou (código ${code}): ${stderr}`));
            }
        });
        process.on("error", (error) => {
            reject(new Error(`Erro ao executar yt-dlp: ${error.message}`));
        });
    });
}
