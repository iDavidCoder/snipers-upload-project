import { downloadAndUploadAudio as downloadWithYtDlp } from './youtubeAudio.js';
// import { downloadAndUploadAudioYtdlCore, validateYtdlCoreAccess } from './youtubeAudioAlternatives.js';

/**
 * Estratégias de download de áudio do YouTube
 */
enum DownloadStrategy {
  YT_DLP = 'yt-dlp',
  YTDL_CORE = 'ytdl-core',
  YOUTUBE_DL = 'youtube-dl',
  API_COMMERCIAL = 'api-commercial'
}

interface DownloadResult {
  success: boolean;
  url?: string;
  error?: string;
  strategy: DownloadStrategy;
  duration: number;
}

/**
 * Serviço híbrido que tenta múltiplas estratégias para download
 */
export class YouTubeAudioDownloader {
  private strategies: DownloadStrategy[] = [
    DownloadStrategy.YT_DLP,
    // DownloadStrategy.YTDL_CORE,
    // DownloadStrategy.YOUTUBE_DL
  ];

  /**
   * Download com fallback automático entre estratégias
   */
  async downloadWithFallback(yt_url: string): Promise<string> {
    const results: DownloadResult[] = [];

    for (const strategy of this.strategies) {
      console.log(`🎯 Tentando estratégia: ${strategy}`);
      const startTime = Date.now();

      try {
        const url = await this.executeStrategy(strategy, yt_url);
        const duration = Date.now() - startTime;
        
        const result: DownloadResult = {
          success: true,
          url,
          strategy,
          duration
        };
        
        results.push(result);
        console.log(`✅ Sucesso com ${strategy} em ${duration}ms`);
        
        return url;

      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        const result: DownloadResult = {
          success: false,
          error: error.message,
          strategy,
          duration
        };
        
        results.push(result);
        console.log(`❌ Falha com ${strategy}: ${error.message}`);
        
        // Se for o último, lançar erro
        if (strategy === this.strategies[this.strategies.length - 1]) {
          throw new Error(`Todas as estratégias falharam:\n${this.formatResults(results)}`);
        }
      }
    }

    throw new Error("Nenhuma estratégia disponível");
  }

  /**
   * Executar estratégia específica
   */
  private async executeStrategy(strategy: DownloadStrategy, yt_url: string): Promise<string> {
    switch (strategy) {
      case DownloadStrategy.YT_DLP:
        return await downloadWithYtDlp(yt_url);
      
      // case DownloadStrategy.YTDL_CORE:
      //   // Verificar se tem acesso primeiro
      //   const hasAccess = await validateYtdlCoreAccess(yt_url);
      //   if (!hasAccess) {
      //     throw new Error("ytdl-core não consegue acessar este vídeo");
      //   }
      //   return await downloadAndUploadAudioYtdlCore(yt_url);
      
      case DownloadStrategy.YOUTUBE_DL:
        return await this.downloadWithYoutubeDl(yt_url);
      
      case DownloadStrategy.API_COMMERCIAL:
        return await this.downloadWithCommercialAPI(yt_url);
      
      default:
        throw new Error(`Estratégia não implementada: ${strategy}`);
    }
  }

  /**
   * Download usando youtube-dl (versão original)
   */
  private async downloadWithYoutubeDl(yt_url: string): Promise<string> {
    // Similar ao yt-dlp mas usando youtube-dl
    throw new Error("youtube-dl não implementado ainda");
  }

  /**
   * Download usando API comercial
   */
  private async downloadWithCommercialAPI(yt_url: string): Promise<string> {
    // Implementação usando APIs como RapidAPI
    throw new Error("API comercial não implementada ainda");
  }

  /**
   * Formatar resultados para debug
   */
  private formatResults(results: DownloadResult[]): string {
    return results
      .map(r => `${r.strategy}: ${r.success ? 'SUCESSO' : 'FALHA'} (${r.duration}ms)${r.error ? ` - ${r.error}` : ''}`)
      .join('\n');
  }

  /**
   * Configurar ordem das estratégias
   */
  setStrategies(strategies: DownloadStrategy[]) {
    this.strategies = strategies;
  }

  /**
   * Verificar quais estratégias estão disponíveis
   */
  async checkAvailableStrategies(): Promise<{ [key in DownloadStrategy]?: boolean }> {
    const availability: { [key in DownloadStrategy]?: boolean } = {};

    // Verificar yt-dlp
    try {
      const { spawn } = await import('child_process');
      const result = await new Promise<boolean>((resolve) => {
        const proc = spawn('yt-dlp', ['--version'], { stdio: 'pipe' });
        proc.on('close', (code) => resolve(code === 0));
        proc.on('error', () => resolve(false));
        setTimeout(() => { proc.kill(); resolve(false); }, 5000);
      });
      availability[DownloadStrategy.YT_DLP] = result;
    } catch {
      availability[DownloadStrategy.YT_DLP] = false;
    }

    // Verificar ytdl-core
    try {
      await import('ytdl-core');
      availability[DownloadStrategy.YTDL_CORE] = true;
    } catch {
      availability[DownloadStrategy.YTDL_CORE] = false;
    }

    // Verificar youtube-dl
    try {
      const { spawn } = await import('child_process');
      const result = await new Promise<boolean>((resolve) => {
        const proc = spawn('youtube-dl', ['--version'], { stdio: 'pipe' });
        proc.on('close', (code) => resolve(code === 0));
        proc.on('error', () => resolve(false));
        setTimeout(() => { proc.kill(); resolve(false); }, 5000);
      });
      availability[DownloadStrategy.YOUTUBE_DL] = result;
    } catch {
      availability[DownloadStrategy.YOUTUBE_DL] = false;
    }

    return availability;
  }
}

// Instância singleton
export const youtubeDownloader = new YouTubeAudioDownloader();