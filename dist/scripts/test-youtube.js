import { downloadAndUploadAudio } from '../services/youtubeAudio.js';
// Script de teste para verificar se as mudanças resolvem o problema de cookies
async function testYouTubeDownload() {
    try {
        console.log('🧪 Testando download de áudio do YouTube...');
        // URL de teste - um vídeo curto e público
        const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        console.log('📥 Iniciando download...');
        const audioUrl = await downloadAndUploadAudio(testUrl);
        console.log('✅ Sucesso!');
        console.log('🎵 URL do áudio:', audioUrl);
    }
    catch (error) {
        console.error('❌ Erro no teste:', error.message);
        // Verificar se ainda é o erro de cookies
        if (error.message.includes('Sign in to confirm')) {
            console.log('⚠️  Ainda há problema com cookies. Soluções:');
            console.log('1. Certifique-se que o Chrome está instalado');
            console.log('2. Faça login no YouTube no Chrome');
            console.log('3. Verifique se o yt-dlp tem permissões para acessar dados do Chrome');
        }
    }
}
// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    testYouTubeDownload();
}
export { testYouTubeDownload };
