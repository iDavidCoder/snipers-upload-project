import ytdl from 'ytdl-core';
import { createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { env } from '../config/env.js';

/**
 * SOLUÇÃO SIMPLES E DIRETA - SEM ENROLAÇÃO
 */
export async function downloadAudioSimple(yt_url: string): Promise<string> {
  console.log(`🎯 BAIXANDO ÁUDIO: ${yt_url}`);
  
  try {
    // Validar URL
    if (!ytdl.validateURL(yt_url)) {
      throw new Error("URL inválida");
    }

    // Obter info do vídeo
    const info = await ytdl.getInfo(yt_url);
    const title = info.videoDetails.title
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    const videoId = info.videoDetails.videoId;
    const timestamp = Date.now();
    const fileName = `${title}-${videoId}-${timestamp}.mp3`;
    
    // Caminhos
    const tempPath = join(process.cwd(), 'temp', `${videoId}.mp4`);
    const finalPath = join(process.cwd(), 'public', 'audios', fileName);
    
    // Criar pastas
    await fs.mkdir(join(process.cwd(), 'temp'), { recursive: true });
    await fs.mkdir(join(process.cwd(), 'public', 'audios'), { recursive: true });
    
    console.log(`📂 Baixando para: ${tempPath}`);
    
    // Baixar áudio
    const audioStream = ytdl(yt_url, {
      quality: 'highestaudio',
      filter: 'audioonly'
    });
    
    const writeStream = createWriteStream(tempPath);
    audioStream.pipe(writeStream);
    
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
      audioStream.on('error', reject);
    });
    
    console.log(`✅ Download concluído, convertendo para MP3...`);
    
    // Converter para MP3
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', tempPath,
        '-vn',
        '-acodec', 'libmp3lame',
        '-ab', '192k',
        '-ar', '44100',
        '-y',
        finalPath
      ]);
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`🎵 MP3 criado: ${finalPath}`);
          resolve();
        } else {
          reject(new Error(`ffmpeg falhou com código ${code}`));
        }
      });
      
      ffmpeg.on('error', reject);
    });
    
    // Limpar arquivo temporário
    await fs.unlink(tempPath).catch(() => {});
    
    // Retornar URL
    const publicUrl = `${env.baseUrl}/audios/${fileName}`;
    console.log(`🌐 Disponível em: ${publicUrl}`);
    
    return publicUrl;
    
  } catch (error: any) {
    console.error(`❌ ERRO:`, error.message);
    throw new Error(`Falha no download: ${error.message}`);
  }
}