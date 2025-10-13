#!/bin/bash

# Script de setup para Railway (executado no container)
echo "🚀 Configurando ambiente Railway..."

# Verificar se yt-dlp está funcionando
echo "📥 Testando yt-dlp..."
yt-dlp --version

# Verificar se ffmpeg está funcionando
echo "🎵 Testando ffmpeg..."
ffmpeg -version | head -1

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p /app/public/audios

# Verificar variáveis de ambiente necessárias
echo "🔧 Verificando variáveis de ambiente..."
if [ -z "$PORT" ]; then
    echo "⚠️  PORT não definido, usando 3000"
    export PORT=3000
fi

echo "✅ Setup concluído!"
echo "🌐 Servidor será iniciado na porta: $PORT"