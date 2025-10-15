import { spawn } from "child_process";
import { createReadStream, promises as fs } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { tmpdir } from "os";

export async function downloadAndUploadAudio(yt_url: string): Promise<string> {
  let tempAudioPath: string | undefined;
  
  try {
    // Validar URL básica do YouTube
    if (!yt_url.includes('youtube.com') && !yt_url.includes('youtu.be')) {
      throw new Error("URL do YouTube inválida");
    }

    // Primeiro, obter metadados do vídeo
    console.log(`Obtendo informações do vídeo: ${yt_url}`);
    
    const videoInfo = await new Promise<any>((resolve, reject) => {
      const ytdlp = spawn("yt-dlp", [
        "--dump-json",
        "--no-warnings",
        yt_url
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let stdout = "";
      let stderr = "";
      
      ytdlp.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      
      ytdlp.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      ytdlp.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Falha ao obter informações do vídeo: ${stderr}`));
          return;
        }
        
        try {
          const info = JSON.parse(stdout);
          resolve(info);
        } catch (e) {
          reject(new Error("Falha ao parsear informações do vídeo"));
        }
      });

      ytdlp.on("error", (err) => {
        reject(new Error(`Erro ao executar yt-dlp: ${err.message}`));
      });
    });

    const title = videoInfo.title?.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50) || 'audio';
    const videoId = videoInfo.id || Math.random().toString(36).substring(7);
    const timestamp = Date.now();
    
    // Criar nome do arquivo final (agora pode ser MP3 já que ffmpeg está instalado)
    const finalFileName = `${title}-${videoId}-${timestamp}.mp3`;
    tempAudioPath = join(tmpdir(), finalFileName);

    console.log(`Baixando áudio para: ${tempAudioPath}`);

    // Agora baixar o áudio e converter para MP3 (ffmpeg disponível)
    await new Promise<void>((resolve, reject) => {
      const ytdlp = spawn("yt-dlp", [
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--no-playlist",
        "--no-warnings",
        "--output", tempAudioPath!,
        yt_url
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let stderr = "";
      let stdout = "";
      
      ytdlp.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        console.log("yt-dlp stdout:", output.trim());
      });
      
      ytdlp.stderr.on("data", (data) => {
        const output = data.toString();
        stderr += output;
        console.log("yt-dlp stderr:", output.trim());
      });

      ytdlp.on("close", (code) => {
        console.log(`yt-dlp download exited with code: ${code}`);
        
        if (code !== 0) {
          reject(new Error(`Falha no download do áudio (código ${code}): ${stderr}`));
          return;
        }
        
        resolve();
      });

      ytdlp.on("error", (err) => {
        reject(new Error(`Erro ao executar yt-dlp: ${err.message}`));
      });
    });

    // Verificar se o arquivo foi criado
    try {
      await fs.access(tempAudioPath);
      console.log(`Arquivo criado com sucesso: ${tempAudioPath}`);
    } catch {
      throw new Error("Arquivo de áudio não foi gerado");
    }

    // Verificar tamanho do arquivo
    const stats = await fs.stat(tempAudioPath);
    if (stats.size === 0) {
      throw new Error("Arquivo de áudio está vazio");
    }

    console.log(`Arquivo válido: ${stats.size} bytes`);

    // Criar cliente Supabase com service role key
    console.log(`Service Role Key existe: ${!!env.supabase.serviceRoleKey}`);
    console.log(`Service Role Key primeiros chars: ${env.supabase.serviceRoleKey?.substring(0, 20)}...`);
    
    if (!env.supabase.serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente");
    }
    
    const supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey);

    console.log(`Fazendo upload para Supabase: ${finalFileName}`);

    // Ler arquivo como buffer em vez de stream para evitar problemas de duplex
    const fileBuffer = await fs.readFile(tempAudioPath);

    // Upload para bucket Audios
    const { error } = await supabase.storage
      .from("Audios")
      .upload(finalFileName, fileBuffer, {
        upsert: true,
        contentType: "audio/mpeg"
      });

    if (error) {
      console.error("Erro detalhado do Supabase:", error);
      throw new Error(`Erro ao fazer upload para Supabase: ${error.message}`);
    }

    console.log("Upload para Supabase concluído com sucesso!");

    // Limpar arquivo temporário APENAS após upload bem-sucedido
    await fs.unlink(tempAudioPath).catch((err) => {
      console.warn("Aviso: não foi possível remover arquivo temporário:", err.message);
    });

    // Retornar URL pública
    const publicUrl = `${env.supabase.url}/storage/v1/object/public/Audios/${finalFileName}`;
    console.log(`Upload concluído: ${publicUrl}`);
    
    return publicUrl;

  } catch (error: any) {
    console.error("Erro geral:", error);
    
    // Limpar arquivo temporário em caso de erro
    if (tempAudioPath) {
      await fs.unlink(tempAudioPath).catch(() => {});
    }
    
    throw new Error(`Erro no processamento do áudio: ${error.message}`);
  }
}