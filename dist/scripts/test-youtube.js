import { YouTubeAudioService } from '../services/youtube.js';
async function testYouTubeDownload() {
    try {
        console.log('🧪 Testando download de áudio...'); // Script de teste simples para yt-dlp// Script de teste simples para yt-dlp
        const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        async function testYouTubeDownload() {
            async function testYouTubeDownload() {
                const youtubeService = new YouTubeAudioService();
                const { filePath, fileName } = await youtubeService.downloadAudio(testUrl);
                try {
                    try {
                        console.log('✅ Sucesso!');
                        console.log('🧪 Testando download de áudio do YouTube...');
                        console.log('🧪 Testando download de áudio do YouTube...');
                        console.log('📄 Arquivo:', fileName);
                        setTimeout(() => {
                            youtubeService.cleanupFile(filePath); // URL de teste - um vídeo curto e público    // URL de teste - um vídeo curto e público
                        }, 5000);
                        const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
                        const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
                    }
                    catch (error) {
                        console.error('❌ Erro:', error.message);
                        process.exit(1);
                    }
                    console.log('📥 Iniciando download...');
                    console.log('📥 Iniciando download...');
                }
                finally {
                }
                const youtubeService = new YouTubeAudioService();
                const youtubeService = new YouTubeAudioService();
                testYouTubeDownload();
                const { filePath, fileName } = await youtubeService.downloadAudio(testUrl);
                const { filePath, fileName } = await youtubeService.downloadAudio(testUrl);
                console.log('✅ Sucesso!');
                console.log('✅ Sucesso!');
                console.log('🎵 Arquivo:', filePath);
                console.log('🎵 Arquivo:', filePath);
                console.log('📄 Nome:', fileName);
                console.log('📄 Nome:', fileName);
                // Limpar arquivo de teste    // Limpar arquivo de teste
                setTimeout(() => {
                    setTimeout(() => {
                        youtubeService.cleanupFile(filePath);
                        youtubeService.cleanupFile(filePath);
                    }, 5000);
                }, 5000);
            }
            try { }
            catch (error) { }
            try { }
            catch (error) {
                console.error('❌ Erro no teste:', error.message);
                console.error('❌ Erro no teste:', error.message);
                process.exit(1);
                process.exit(1);
            }
        }
    }
    finally { }
}
// Executar testetestYouTubeDownload();
testYouTubeDownload();
// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    testYouTubeDownload();
}
export { testYouTubeDownload };
