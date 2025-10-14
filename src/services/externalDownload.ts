/**
 * Solução 3: Usar serviço externo para download
 * Ex: cobalt.tools, yt1s.com, etc.
 */

import axios from 'axios';

export async function downloadViaExternalService(youtubeUrl: string) {
  try {
    // Exemplo usando cobalt.tools API (gratuita)
    const response = await axios.post('https://co.wuk.sh/api/json', {
      url: youtubeUrl,
      vFormat: "mp3",
      vQuality: "128",
      aFormat: "mp3"
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status === 'success') {
      return {
        downloadUrl: response.data.url,
        title: response.data.filename || 'audio',
        duration: response.data.duration
      };
    } else {
      throw new Error(`Serviço externo falhou: ${response.data.text}`);
    }
  } catch (error: any) {
    throw new Error(`Erro no serviço externo: ${error.message}`);
  }
}

/**
 * Download do arquivo do serviço externo para o Railway
 */
export async function downloadFromExternalUrl(downloadUrl: string, outputPath: string) {
  const response = await axios({
    method: 'GET',
    url: downloadUrl,
    responseType: 'stream'
  });

  const fs = require('fs');
  const writer = fs.createWriteStream(outputPath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}