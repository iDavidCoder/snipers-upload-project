#!/bin/bash

# Script de setup para Railway (executado no container)
echo "🚀 Configurando ambiente Railway..."

# Verificar se yt-dlp está funcionando
echo "📥 Testando yt-dlp..."
if yt-dlp --version; then
    echo "✅ yt-dlp instalado e funcionando"
else
    echo "❌ Erro com yt-dlp, tentando reinstalar..."
    pip3 install --upgrade --break-system-packages yt-dlp || echo "⚠️ Falha ao instalar yt-dlp"
fi

# Verificar se ffmpeg está funcionando
echo "🎵 Testando ffmpeg..."
if ffmpeg -version | head -1; then
    echo "✅ ffmpeg instalado e funcionando"
else
    echo "❌ Erro com ffmpeg"
fi

# Verificar se Python está funcionando
echo "🐍 Testando Python..."
python3 --version

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p /app/public/audios
chmod 755 /app/public/audios

# Verificar variáveis de ambiente necessárias
echo "🔧 Verificando variáveis de ambiente..."
if [ -z "$PORT" ]; then
    echo "⚠️  PORT não definido, usando 3000"
    export PORT=3000
fi

# Testar uma requisição simples do yt-dlp
echo "🧪 Testando yt-dlp com vídeo de exemplo..."
if yt-dlp --dump-json --no-warnings "https://www.youtube.com/watch?v=dQw4w9WgXcQ" > /dev/null 2>&1; then
    echo "✅ yt-dlp consegue acessar YouTube"
else
    echo "⚠️ yt-dlp teve problemas para acessar YouTube (isso é normal em alguns casos)"
fi

echo "✅ Setup concluído!"
echo "🌐 Servidor será iniciado na porta: $PORT"