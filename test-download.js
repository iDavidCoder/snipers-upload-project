#!/usr/bin/env node

/**
 * TESTE RÁPIDO - SEM ENROLAÇÃO
 * Execute: node test-download.js
 */

import { downloadAudioSimple } from './src/services/simpleDownload.js';

async function testeRapido() {
  console.log('🚀 TESTE RÁPIDO DE DOWNLOAD');
  console.log('========================');
  
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  
  try {
    console.log(`📺 Testando: ${testUrl}`);
    const result = await downloadAudioSimple(testUrl);
    console.log(`✅ SUCESSO: ${result}`);
  } catch (error) {
    console.log(`❌ ERRO: ${error.message}`);
    process.exit(1);
  }
}

testeRapido();