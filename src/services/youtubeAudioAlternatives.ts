import ytdl from 'ytdl-core';
import { createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { env } from '../config/env.js';
import { tmpdir } from 'os';

/**
 * Alternativa usando ytdl-core em vez de yt-dlp
 * Vantagens: Nativo Node.js, sem dependências externas
 * Desvantagens: Pode ser bloqueado mais facilmente
 */
export async function downloadAndUploadAudioYtdlCore(yt_url: string): Promise<string> {
  let tempAudioPath: string | undefined;
  let tempVideoPath: string | undefined;
  
  try {
    // Validar URL do YouTube
    if (!ytdl.validateURL(yt_url)) {
      throw new Error("URL do YouTube inválida");
    }

    console.log(`Obtendo informações do vídeo: ${yt_url}`);
    
    // Obter informações do vídeo
    const info = await ytdl.getInfo(yt_url);
    const title = info.videoDetails.title
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) || 'audio';
    const videoId = info.videoDetails.videoId;
    const timestamp = Date.now();
    
    const finalFileName = `${title}-${videoId}-${timestamp}.mp3`;
    const publicAudioPath = join(process.cwd(), "public", "audios", finalFileName);
    
    // Caminhos temporários
    tempVideoPath = join(tmpdir(), `${videoId}-${timestamp}.mp4`);
    tempAudioPath = join(tmpdir(), finalFileName);

    console.log(`Baixando áudio para: ${tempVideoPath}`);

    // Baixar apenas áudio (melhor qualidade disponível)
    const audioStream = ytdl(yt_url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    // Salvar stream para arquivo temporário
    const writeStream = createWriteStream(tempVideoPath);
    audioStream.pipe(writeStream);

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
      audioStream.on('error', reject);
    });

    console.log(`Download concluído. Convertendo para MP3...`);

    // Converter para MP3 usando ffmpeg
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', tempVideoPath!,
        '-vn', // Sem vídeo
        '-acodec', 'libmp3lame',
        '-ab', '192k',
        '-ar', '44100',
        '-y', // Sobrescrever arquivo
        tempAudioPath!
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stderr = '';
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Falha na conversão para MP3: ${stderr}`));
          return;
        }
        resolve();
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`Erro ao executar ffmpeg: ${err.message}`));
      });
    });

    // Verificar se o arquivo MP3 foi criado
    try {
      await fs.access(tempAudioPath);
      const stats = await fs.stat(tempAudioPath);
      if (stats.size === 0) {
        throw new Error("Arquivo de áudio está vazio");
      }
      console.log(`Arquivo MP3 criado: ${stats.size} bytes`);
    } catch {
      throw new Error("Arquivo de áudio não foi gerado");
    }

    // Garantir que a pasta public/audios existe
    await fs.mkdir(join(process.cwd(), "public", "audios"), { recursive: true });
    
    // Mover arquivo para pasta pública
    await fs.copyFile(tempAudioPath, publicAudioPath);
    
    console.log("Arquivo salvo na pasta pública com sucesso!");

    // Limpar arquivos temporários
    if (tempVideoPath) {
      await fs.unlink(tempVideoPath).catch(() => {});
    }
    if (tempAudioPath) {
      await fs.unlink(tempAudioPath).catch(() => {});
    }

    // Retornar URL público
    const publicUrl = `${env.baseUrl}/audios/${finalFileName}`;
    console.log(`Arquivo disponível em: ${publicUrl}`);
    
    return publicUrl;

  } catch (error: any) {
    console.error("Erro no ytdl-core:", error);
    
    // Limpar arquivos temporários em caso de erro
    if (tempVideoPath) {
      await fs.unlink(tempVideoPath).catch(() => {});
    }
    if (tempAudioPath) {
      await fs.unlink(tempAudioPath).catch(() => {});
    }
    
    throw new Error(`Erro no processamento do áudio (ytdl-core): ${error.message}`);
  }
}

/**
 * Alternativa usando youtube-dl-exec
 */
export async function downloadAndUploadAudioYoutubeDlExec(yt_url: string): Promise<string> {
  // Implementação seria similar ao yt-dlp atual
  // mas usando youtube-dl-exec que é um wrapper Node.js
  throw new Error("Não implementado ainda");
}

/**
 * Verificar se ytdl-core consegue acessar o vídeo
 */
export async function validateYtdlCoreAccess(yt_url: string): Promise<boolean> {
  try {
    if (!ytdl.validateURL(yt_url)) {
      return false;
    }
    
    // Tentar obter info básica (timeout de 10s)
    const info = await Promise.race([
      ytdl.getBasicInfo(yt_url),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
    ]);
    
    return !!(info as any)?.videoDetails?.title;
  } catch {
    return false;
  }
}