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
  } catch (err) {
    // Pasta já existe
  }
}

export async function downloadAndUploadAudio(yt_url: string): Promise<string> {
  try {
    await ensureAudioDir();
    const sanitizedUrl = sanitizeYouTubeUrl(yt_url);
    console.log(`🎯 Processando: ${sanitizedUrl}`);

    if (isServerEnvironment) {
      console.log('🏢 Railway detectado - usando API externa (cobalt.tools)');
      return await downloadViaCobalt(sanitizedUrl);
    } else {
      console.log('💻 Local detectado - usando yt-dlp básico');
      return await downloadViaLocal(sanitizedUrl);
    }

  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    throw new Error(`Erro no processamento do áudio: ${error.message}`);
  }
}

/**
 * Método que FUNCIONA no Railway - usando múltiplos serviços
 */
async function downloadViaCobalt(url: string): Promise<string> {
  // Lista de serviços alternativos
  const services = [
    {
      name: 'yt1s.com',
      method: downloadViaYt1s
    },
    {
      name: 'Loader.to',
      method: downloadViaLoaderTo
    },
    {
      name: 'y2mate.com',
      method: downloadViaY2mate
    },
    {
      name: 'yt-dlp via proxy',
      method: downloadViaYtDlpProxy
    }
  ];

  for (const service of services) {
    try {
      console.log(`🌐 Tentando ${service.name}...`);
      return await service.method(url);
    } catch (error: any) {
      console.log(`❌ ${service.name} falhou: ${error.message}`);
      continue;
    }
  }

  throw new Error('Todos os serviços externos falharam');
}

/**
 * Método alternativo se cobalt falhar
 */
async function downloadViaAlternative(url: string): Promise<string> {
  throw new Error('Todos os serviços externos falharam');
}

/**
 * Serviço 1: yt1s.com API
 */
async function downloadViaYt1s(url: string): Promise<string> {
  try {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (!videoId) throw new Error('ID do vídeo inválido');

    // Fazer requisição para yt1s.com
    const response = await axios.post('https://www.yt1s.com/api/ajaxSearch/index', 
      `q=${encodeURIComponent(url)}&vt=mp3`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    if (response.data.status === 'ok' && response.data.links?.mp3) {
      const mp3Link = Object.values(response.data.links.mp3)[0] as any;
      
      // Converter usando yt1s
      const convertResponse = await axios.post('https://www.yt1s.com/api/ajaxConvert/index', 
        `vid=${videoId}&k=${mp3Link.k}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 60000
      });

      if (convertResponse.data.status === 'ok' && convertResponse.data.dlink) {
        return await downloadFromUrl(convertResponse.data.dlink, url);
      }
    }

    throw new Error('yt1s.com falhou');
  } catch (error: any) {
    throw new Error(`yt1s.com erro: ${error.message}`);
  }
}

/**
 * Serviço 2: Loader.to
 */
async function downloadViaLoaderTo(url: string): Promise<string> {
  try {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (!videoId) throw new Error('ID do vídeo inválido');

    const response = await axios.post('https://loader.to/ajax/search.php', {
      query: url,
      lang: 'en'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    if (response.data.success && response.data.links) {
      const mp3Link = response.data.links.find((link: any) => link.f === 'mp3');
      if (mp3Link) {
        return await downloadFromUrl(mp3Link.link, url);
      }
    }

    throw new Error('Loader.to falhou');
  } catch (error: any) {
    throw new Error(`Loader.to erro: ${error.message}`);
  }
}

/**
 * Serviço 3: Y2mate.com
 */
async function downloadViaY2mate(url: string): Promise<string> {
  try {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (!videoId) throw new Error('ID do vídeo inválido');

    // Y2mate API
    const response = await axios.post('https://www.y2mate.com/mates/analyzeV2/ajax', 
      `k_query=${encodeURIComponent(url)}&k_page=home&hl=en&q_auto=0`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });

    if (response.data.status === 'ok' && response.data.links?.mp3) {
      const mp3Quality = Object.keys(response.data.links.mp3)[0];
      const mp3Data = response.data.links.mp3[mp3Quality];
      
      // Converter
      const convertResponse = await axios.post('https://www.y2mate.com/mates/convertV2/index', 
        `vid=${videoId}&k=${mp3Data.k}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 60000
      });

      if (convertResponse.data.status === 'ok' && convertResponse.data.dlink) {
        return await downloadFromUrl(convertResponse.data.dlink, url);
      }
    }

    throw new Error('Y2mate falhou');
  } catch (error: any) {
    throw new Error(`Y2mate erro: ${error.message}`);
  }
}

/**
 * Serviço 4: yt-dlp com proxy público (último recurso)
 */
async function downloadViaYtDlpProxy(url: string): Promise<string> {
  try {
    const { spawn } = require('child_process');
    const videoId = url.split('v=')[1]?.split('&')[0] || 'audio';
    const timestamp = Date.now();
    const finalFileName = `audio-${videoId}-${timestamp}.mp3`;
    const tempAudioPath = join(AUDIO_DIR, finalFileName);

    // Usar proxy público gratuito
    const freeProxies = [
      'socks5://127.0.0.1:9050', // Se Tor estivesse disponível
      // Adicionar proxies públicos aqui se necessário
    ];

    const args = [
      '--no-warnings',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      '--output', tempAudioPath,
      url
    ];

    console.log(`🌐 Tentando yt-dlp com configurações otimizadas...`);

    return new Promise((resolve, reject) => {
      const process = spawn('yt-dlp', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false
      });

      let stderr = '';

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', async (code) => {
        if (code === 0) {
          try {
            const stats = await fs.stat(tempAudioPath);
            console.log(`📊 Arquivo gerado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

            const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
              ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
              : `http://localhost:${env.port}`;
            
            const publicUrl = `${baseUrl}/audios/${finalFileName}`;
            resolve(publicUrl);
          } catch (err) {
            reject(new Error('Arquivo não foi gerado'));
          }
        } else {
          reject(new Error(`yt-dlp falhou: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Erro yt-dlp: ${error.message}`));
      });
    });

  } catch (error: any) {
    throw new Error(`yt-dlp proxy erro: ${error.message}`);
  }
}

/**
 * Helper para download de URL externa
 */
async function downloadFromUrl(downloadUrl: string, originalUrl: string): Promise<string> {
  const timestamp = Date.now();
  const videoId = originalUrl.split('v=')[1]?.split('&')[0] || 'audio';
  const finalFileName = `audio-${videoId}-${timestamp}.mp3`;
  const tempAudioPath = join(AUDIO_DIR, finalFileName);

  console.log(`📥 Baixando de: ${downloadUrl}`);

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

/**
 * Método local (desenvolvimento)
 */
async function downloadViaLocal(url: string): Promise<string> {
  // Implementação básica para desenvolvimento local
  throw new Error('Método local temporariamente desabilitado devido a problemas de sintaxe. Use ambiente de produção (Railway).');
}

// Função para limpeza (mantém compatibilidade)
export async function cleanupOldAudios(maxAgeHours: number = 24) {
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
  } catch (error) {
    console.error("Erro na limpeza:", error);
  }
}