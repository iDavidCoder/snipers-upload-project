import { spawn } from "child_process";
import { promises as fs } from "fs";
import { join } from "path";
import { env } from "../config/env.js";
import { tmpdir } from "os";
import { detectCookiesPath, getCookiesArgs, validateYtDlpCookiesSupport } from "../utils/cookies.js";

export async function downloadAndUploadAudio(yt_url: string): Promise<string> {
  let tempAudioPath: string | undefined;
  
  try {
    // Validar URL básica do YouTube
    if (!yt_url.includes('youtube.com') && !yt_url.includes('youtu.be')) {
      throw new Error("URL do YouTube inválida");
    }

    // Usar cookies diretos do arquivo
    const cookiesPath = join(process.cwd(), "cookies.txt");
    console.log(`Usando cookies do arquivo: ${cookiesPath}`);

    // Configurar argumentos do yt-dlp com cookies diretos
    const getYtDlpArgs = (additionalArgs: string[] = []) => {
      const baseArgs = [
        "--no-warnings",
        "--cookies", cookiesPath
      ];
      
      console.log(`Usando cookies do arquivo: ${cookiesPath}`);
      return [...baseArgs, ...additionalArgs];
    };

    // Primeiro, obter metadados do vídeo
    console.log(`Obtendo informações do vídeo: ${yt_url}`);
    
    const videoInfo = await new Promise<any>((resolve, reject) => {
      const args = getYtDlpArgs(["--dump-json", yt_url]);
      console.log(`Executando yt-dlp com argumentos:`, args.join(' '));
      
      const ytdlp = spawn("yt-dlp", args, {
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
    
    // Criar nome do arquivo final e definir caminho público
    const finalFileName = `${title}-${videoId}-${timestamp}.mp3`;
    const publicAudioPath = join(process.cwd(), "public", "audios", finalFileName);
    tempAudioPath = join(tmpdir(), finalFileName);

    console.log(`Baixando áudio para: ${tempAudioPath}`);

    // Agora baixar o áudio e converter para MP3 (ffmpeg disponível)
    await new Promise<void>((resolve, reject) => {
      const downloadArgs = getYtDlpArgs([
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--no-playlist",
        "--output", tempAudioPath!,
        yt_url
      ]);
      
      console.log(`Executando download com argumentos: ${downloadArgs.join(' ')}`);
      
      const ytdlp = spawn("yt-dlp", downloadArgs, {
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

    // Mover arquivo para pasta pública em vez de fazer upload para Supabase
    console.log(`Movendo arquivo para pasta pública: ${publicAudioPath}`);
    
    // Garantir que a pasta public/audios existe
    await fs.mkdir(join(process.cwd(), "public", "audios"), { recursive: true });
    
    // Mover arquivo temporário para pasta pública
    await fs.copyFile(tempAudioPath, publicAudioPath);
    
    console.log("Arquivo salvo na pasta pública com sucesso!");

    // Limpar arquivo temporário APENAS após cópia bem-sucedida
    await fs.unlink(tempAudioPath).catch((err) => {
      console.warn("Aviso: não foi possível remover arquivo temporário:", err.message);
    });

    // Retornar URL público local
    const publicUrl = `${env.baseUrl || 'http://localhost:3000'}/audios/${finalFileName}`;
    console.log(`Arquivo disponível em: ${publicUrl}`);
    
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