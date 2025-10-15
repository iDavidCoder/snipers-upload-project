#!/usr/bin/env node

/**
 * Script para testar a configuração de cookies do yt-dlp
 * Execute com: npm run test-cookies
 */

import { detectCookiesPath, validateYtDlpCookiesSupport, getCookiesArgs } from "./src/utils/cookies.js";
import { spawn } from "child_process";

async function testCookiesSetup() {
  console.log("🔍 Testando configuração de cookies do yt-dlp...\n");

  // 1. Verificar se yt-dlp suporta cookies
  console.log("1. Verificando suporte a cookies do yt-dlp...");
  const cookiesSupported = await validateYtDlpCookiesSupport();
  console.log(`   ✓ Suporte a cookies: ${cookiesSupported ? 'Sim' : 'Não'}\n`);

  if (!cookiesSupported) {
    console.log("❌ yt-dlp não suporta cookies ou não está instalado corretamente");
    console.log("   Instale/atualize o yt-dlp: pip install -U yt-dlp");
    return;
  }

  // 2. Detectar caminhos de cookies
  console.log("2. Detectando caminhos de cookies...");
  const cookiesConfig = await detectCookiesPath();
  
  if (cookiesConfig) {
    console.log(`   ✓ Configuração encontrada: ${cookiesConfig.browser}${cookiesConfig.path ? ':' + cookiesConfig.path : ''}`);
    console.log(`   ✓ Argumentos: ${getCookiesArgs(cookiesConfig).join(' ')}\n`);
  } else {
    console.log("   ⚠️  Nenhuma configuração de cookies encontrada\n");
  }

  // 3. Testar com um vídeo público do YouTube
  console.log("3. Testando com vídeo público do YouTube...");
  const testUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Rick Roll - sempre disponível
  
  const args = ["--dump-json", "--no-warnings"];
  if (cookiesConfig) {
    args.push(...getCookiesArgs(cookiesConfig));
  }
  args.push(testUrl);

  console.log(`   Comando: yt-dlp ${args.join(' ')}`);

  const result = await new Promise<boolean>((resolve) => {
    const ytdlp = spawn("yt-dlp", args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let success = false;
    let stderr = "";

    ytdlp.stdout.on("data", (data) => {
      try {
        const info = JSON.parse(data.toString());
        if (info.title) {
          console.log(`   ✓ Sucesso! Título: ${info.title}`);
          success = true;
        }
      } catch {
        // Ignorar erros de parsing parcial
      }
    });

    ytdlp.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ytdlp.on("close", (code) => {
      if (code !== 0 && !success) {
        console.log(`   ❌ Falha (código ${code})`);
        console.log(`   Erro: ${stderr.trim()}`);
      }
      resolve(success);
    });

    // Timeout de 30 segundos
    setTimeout(() => {
      ytdlp.kill();
      if (!success) {
        console.log("   ⏰ Timeout - teste demorou muito");
      }
      resolve(success);
    }, 30000);
  });

  // 4. Resumo final
  console.log("\n📊 Resumo:");
  console.log(`   yt-dlp instalado: ${cookiesSupported ? '✓' : '❌'}`);
  console.log(`   Cookies configurados: ${cookiesConfig ? '✓' : '⚠️'}`);
  console.log(`   Teste funcional: ${result ? '✓' : '❌'}`);

  if (result) {
    console.log("\n🎉 Configuração está funcionando!");
  } else {
    console.log("\n💡 Dicas para resolver problemas:");
    console.log("   1. Certifique-se que o Chrome está instalado");
    console.log("   2. Faça login no YouTube pelo Chrome");
    console.log("   3. Atualize o yt-dlp: pip install -U yt-dlp");
    console.log("   4. Para Flatpak: defina YOUTUBE_COOKIES_PATH=~/.var/app/com.google.Chrome");
  }
}

// Executar teste
testCookiesSetup().catch(console.error);