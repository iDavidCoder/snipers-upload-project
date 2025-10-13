#!/bin/bash

echo "🧪 Testando Build Local do Docker..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker Desktop primeiro."
    exit 1
fi

# Build da imagem
echo "🔨 Buildando imagem Docker..."
docker build -t youtube-audio-test .

if [ $? -ne 0 ]; then
    echo "❌ Falha no build da imagem Docker"
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# Executar container para teste
echo "🚀 Iniciando container de teste..."
docker run --rm -p 3000:3000 \
    -e PORT=3000 \
    -e NODE_ENV=production \
    youtube-audio-test

echo "🌐 Container iniciado em http://localhost:3000"
echo "💡 Pressione Ctrl+C para parar o container"