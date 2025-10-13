import { promises as fs } from "fs";
import { join } from "path";
import { spawn } from "child_process";
import { getOptimizedYtDlpArgs } from "./ytdlpConfig.js";

const COOKIES_FILE = join(process.cwd(), 'youtube_cookies.txt');

/**
 * Função simplificada - não tenta mais usar cookies do Chrome
 * Evita problemas em qualquer ambiente
 */
export async function exportChromeCookies(): Promise<void> {
  console.log('Pulando exportação de cookies - usando método sem cookies otimizado');
  return Promise.resolve();
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
 * Retorna os argumentos do yt-dlp otimizados para evitar detecção de bot
 */
export async function getYtDlpArgs(baseArgs: string[]): Promise<string[]> {
  console.log('Usando configuração anti-detecção robusta (sem cookies)');
  
  // Combinar argumentos otimizados com os argumentos base
  const optimizedArgs = getOptimizedYtDlpArgs();
  return [...optimizedArgs, ...baseArgs];
}