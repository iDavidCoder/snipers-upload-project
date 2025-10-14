/**
 * Solução 2: Usar proxy para mascarar IP do Railway
 * Implementação com proxy HTTP/SOCKS
 */

import { spawn } from 'child_process';

export async function downloadWithProxySupport(url: string, outputPath: string) {
  const proxyUrl = process.env.PROXY_URL; // Ex: http://proxy.example.com:8080
  
  if (!proxyUrl) {
    throw new Error('PROXY_URL não configurado');
  }

  const args = [
    "--proxy", proxyUrl,
    "--no-warnings",
    "--extract-audio",
    "--audio-format", "mp3",
    "--output", outputPath,
    url
  ];

  console.log('🌐 Usando proxy:', proxyUrl);
  console.log('📥 Argumentos yt-dlp:', args);

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
        reject(new Error(`yt-dlp com proxy falhou (código ${code}): ${stderr}`));
      }
    });

    process.on("error", (error) => {
      reject(new Error(`Erro ao executar yt-dlp com proxy: ${error.message}`));
    });
  });
}