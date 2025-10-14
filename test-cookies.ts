import { YouTubeAudioService } from './src/services/youtube.js';

async function testCookies() {
  console.log('🍪 Testando download com cookies...');
  
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const service = new YouTubeAudioService();
  
  try {
    const result = await service.downloadAudio(testUrl);
    console.log('✅ Sucesso!', result.fileName);
    
    // Limpar após teste
    setTimeout(() => service.cleanupFile(result.filePath), 5000);
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  }
}

testCookies();