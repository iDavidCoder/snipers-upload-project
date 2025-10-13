/**
 * Utilitários para sanitização de entrada e validação
 */
/**
 * Sanitiza uma URL do YouTube para evitar shell injection e outros problemas
 */
export function sanitizeYouTubeUrl(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('URL inválida: deve ser uma string não vazia');
    }
    // Remover espaços em branco
    const trimmed = url.trim();
    // Validar formato básico de URL do YouTube
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;
    if (!youtubeRegex.test(trimmed)) {
        throw new Error('URL do YouTube inválida. Deve ser do formato: https://youtube.com/watch?v=VIDEO_ID ou https://youtu.be/VIDEO_ID');
    }
    // Extrair apenas o ID do vídeo para reconstruir URL limpa
    const videoId = extractVideoId(trimmed);
    if (!videoId) {
        throw new Error('Não foi possível extrair ID do vídeo da URL');
    }
    // Retornar URL limpa e padronizada
    return `https://www.youtube.com/watch?v=${videoId}`;
}
/**
 * Extrai o ID do vídeo de uma URL do YouTube
 */
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}
/**
 * Sanitiza argumentos para evitar shell injection
 */
export function sanitizeArguments(args) {
    return args.map(arg => {
        // Remover caracteres perigosos que podem causar problemas no shell
        if (typeof arg !== 'string')
            return String(arg);
        // Para URLs, usar sanitizeYouTubeUrl se parecer com uma URL do YouTube
        if (arg.includes('youtube.com') || arg.includes('youtu.be')) {
            try {
                return sanitizeYouTubeUrl(arg);
            }
            catch {
                // Se falhar, continuar com sanitização básica
            }
        }
        // Sanitização básica - remover caracteres problemáticos
        return arg.replace(/[;&|`$(){}[\]\\]/g, '');
    });
}
