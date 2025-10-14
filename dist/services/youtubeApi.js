import { google } from 'googleapis';
import { env } from '../config/env.js';
/**
 * Solução alternativa usando YouTube Data API
 * Funciona 100% no Railway sem problemas de IP
 */
const youtube = google.youtube({
    version: 'v3',
    auth: env.youtubeApiKey // Adicionar no .env
});
export async function getVideoInfoViaApi(videoId) {
    try {
        const response = await youtube.videos.list({
            part: ['snippet', 'contentDetails'],
            id: [videoId]
        });
        if (!response.data.items || response.data.items.length === 0) {
            throw new Error('Vídeo não encontrado');
        }
        const video = response.data.items[0];
        return {
            id: video.id,
            title: video.snippet?.title,
            description: video.snippet?.description,
            duration: video.contentDetails?.duration,
            thumbnails: video.snippet?.thumbnails
        };
    }
    catch (error) {
        throw new Error(`Erro na YouTube API: ${error.message}`);
    }
}
/**
 * Alternativa: usar youtube-dl-exec com proxy
 */
export async function downloadWithProxy(url, outputPath) {
    // Esta seria uma implementação com proxy se necessário
    console.log('Implementar download com proxy se necessário');
}
