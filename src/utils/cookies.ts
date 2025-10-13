import { promises as fs } from "fs";
import { join } from "path";
import { spawn } from "child_process";

const COOKIES_FILE = join(process.cwd(), 'youtube_cookies.txt');

/**
 * Exporta cookies do Chrome para usar com yt-dlp
 * No Docker/Railway não há Chrome, então essa função é um no-op
 */
export async function exportChromeCookies(): Promise<void> {
  // No ambiente Docker/Railway não temos Chrome
  if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
    console.log('Ambiente de produção detectado - pulando exportação de cookies do Chrome');
    return;
  }
  
  return new Promise((resolve, reject) => {
    console.log('Tentando exportar cookies do Chrome para YouTube...');
    
    const ytdlp = spawn("yt-dlp", [
      "--cookies-from-browser", "chrome",
      "--cookies", COOKIES_FILE,
      "--write-info-json",
      "--skip-download",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // Vídeo de teste
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let stderr = "";
    
    ytdlp.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ytdlp.on("close", (code) => {
      if (code === 0) {
        console.log('Cookies exportados com sucesso!');
        resolve();
      } else {
        console.warn('Falha ao exportar cookies, continuando sem eles...');
        resolve();
      }
    });

    ytdlp.on("error", (err) => {
      console.warn('Erro ao exportar cookies, continuando sem eles...', err.message);
      resolve();
    });
  });
}

/**
 * Verifica se o arquivo de cookies existe
 */
export async function cookiesFileExists(): Promise<boolean> {
  try {
    await fs.access(COOKIES_FILE);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retorna os argumentos do yt-dlp com cookies se disponível
 */
export async function getYtDlpArgs(baseArgs: string[]): Promise<string[]> {
  // Em produção (Railway/Docker), usar estratégias alternativas
  if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
    console.log('Ambiente de produção - usando configuração otimizada para servidor');
    return [
      // Estratégias anti-detecção para produção
      "--user-agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "--add-header", "Accept-Language:en-US,en;q=0.9",
      "--add-header", "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "--add-header", "Accept-Encoding:gzip, deflate, br",
      "--add-header", "DNT:1",
      "--add-header", "Connection:keep-alive",
      "--add-header", "Upgrade-Insecure-Requests:1",
      ...baseArgs
    ];
  }
  
  // Desenvolvimento local - tentar usar cookies do Chrome
  const hasCookies = await cookiesFileExists();
  
  if (hasCookies) {
    console.log('Usando cookies salvos do Chrome');
    return ["--cookies", COOKIES_FILE, ...baseArgs];
  } else {
    console.log('Tentando usar cookies do Chrome diretamente');
    try {
      return ["--cookies-from-browser", "chrome", ...baseArgs];
    } catch {
      console.warn('Chrome não disponível, usando configuração básica');
      return baseArgs;
    }
  }
}