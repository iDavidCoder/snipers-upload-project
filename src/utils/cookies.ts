import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface CookiesConfig {
  browser: string;
  path?: string;
}

/**
 * Detecta automaticamente o melhor caminho para cookies do navegador no sistema
 */
export async function detectCookiesPath(): Promise<CookiesConfig | null> {
  const home = homedir();
  
  // Caminhos possíveis para Chrome no Linux
  const chromePaths = [
    // Chrome padrão no Linux
    join(home, ".config", "google-chrome"),
    // Chrome via Flatpak
    join(home, ".var", "app", "com.google.Chrome"),
    // Chromium
    join(home, ".config", "chromium"),
    // Chrome via Snap
    join(home, "snap", "chromium", "current", ".config", "chromium")
  ];

  // Verificar qual caminho existe
  for (const path of chromePaths) {
    try {
      await fs.access(path);
      console.log(`Caminho de cookies encontrado: ${path}`);
      return {
        browser: "chrome",
        path: path
      };
    } catch {
      // Caminho não existe, continuar
    }
  }

  // Se nenhum caminho específico foi encontrado, usar padrão
  console.log("Usando configuração padrão de cookies do Chrome");
  return {
    browser: "chrome"
  };
}

/**
 * Gera argumentos do yt-dlp para autenticação com cookies
 */
export function getCookiesArgs(config?: CookiesConfig): string[] {
  if (!config) {
    return [];
  }

  if (config.path) {
    return ["--cookies-from-browser", `${config.browser}:${config.path}`];
  } else {
    return ["--cookies-from-browser", config.browser];
  }
}

/**
 * Valida se o yt-dlp está instalado e suporta cookies
 */
export async function validateYtDlpCookiesSupport(): Promise<boolean> {
  try {
    const { spawn } = await import("child_process");
    
    return new Promise((resolve) => {
      const ytdlp = spawn("yt-dlp", ["--help"], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = "";
      ytdlp.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      ytdlp.on("close", (code) => {
        // Verificar se suporta cookies
        const supportsCookies = stdout.includes("--cookies-from-browser");
        resolve(code === 0 && supportsCookies);
      });

      ytdlp.on("error", () => {
        resolve(false);
      });

      // Timeout de 5 segundos
      setTimeout(() => {
        ytdlp.kill();
        resolve(false);
      }, 5000);
    });
  } catch {
    return false;
  }
}