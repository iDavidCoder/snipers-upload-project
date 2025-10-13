/**
 * Método alternativo simples para downloads do YouTube
 * Usa configurações mínimas que funcionam consistentemente
 */

import { spawn } from "child_process";

export interface SimpleYtDlpOptions {
  url: string;
  outputPath?: string;
  format?: 'mp3' | 'mp4';
  quality?: string;
}

/**
 * Download com estratégias anti-detecção progressivas
 */
export async function simpleYtDlpDownload(options: SimpleYtDlpOptions): Promise<string> {
  const { url, outputPath, format = 'mp3', quality = '0' } = options;

  // Estratégia 1: Método básico
  let args = [
    "--no-warnings",
    "--no-check-certificate",
    "--prefer-insecure"
  ];

  // Usar cookies.txt se existir - testar múltiplos caminhos
  const path = require('path');
  const fs = require('fs');
  
  const cookiesPaths = [
    "src/cookies/cookies.txt",
    "./src/cookies/cookies.txt", 
    path.join(process.cwd(), "src", "cookies", "cookies.txt"),
    path.join(__dirname, "..", "..", "cookies", "cookies.txt")
  ];
  
  let cookiesFound = false;
  for (const cookiesPath of cookiesPaths) {
    if (fs.existsSync(cookiesPath)) {
      args.push("--cookies", cookiesPath);
      console.log(`✅ Usando cookies: ${cookiesPath}`);
      cookiesFound = true;
      break;
    }
  }
  
  if (!cookiesFound) {
    console.log("⚠️ Nenhum cookies.txt encontrado nos caminhos:", cookiesPaths);
    console.log("📁 Diretório atual:", process.cwd());
    console.log("📁 __dirname:", __dirname);
  }
  
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
  } catch (error: any) {
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
    for (const cookiesPath of cookiesPaths) {
      if (fs.existsSync(cookiesPath)) {
        args.push("--cookies", cookiesPath);
        console.log(`🛡️ Anti-detecção usando cookies: ${cookiesPath}`);
        break;
      }
    }
    
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
function executeYtDlpDownload(args: string[]): Promise<string> {
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
      } else {
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
export async function simpleYtDlpInfo(url: string): Promise<any> {
  // Estratégia 1: Método básico (funciona localmente)
  let args = [
    "--dump-json",
    "--no-warnings", 
    "--no-check-certificate",
    url
  ];

  console.log('🎯 Tentativa 1 - Método básico:', args);

  try {
    return await executeYtDlp(args);
  } catch (error: any) {
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
      "--max-sleep-interval", "5",
      url
    ];

    console.log('🛡️ Tentativa 2 - Anti-detecção:', args);
    
    try {
      return await executeYtDlp(args);
    } catch (error2: any) {
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
        "--geo-bypass",
        url
      ];

      console.log('🌍 Tentativa 3 - Simulação geográfica:', args);
      return await executeYtDlp(args);
    }
  }
}

/**
 * Função helper para executar yt-dlp
 */
function executeYtDlp(args: string[]): Promise<any> {
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
        } catch (e) {
          reject(new Error("Falha ao parsear informações do vídeo"));
        }
      } else {
        reject(new Error(`yt-dlp falhou (código ${code}): ${stderr}`));
      }
    });

    process.on("error", (error) => {
      reject(new Error(`Erro ao executar yt-dlp: ${error.message}`));
    });
  });
}