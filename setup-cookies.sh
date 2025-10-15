#!/bin/bash

# Script para configurar o ambiente no Linux (Hostinger/EasyPanel)

echo "🚀 Configurando ambiente para yt-dlp com cookies..."

# 1. Verificar se yt-dlp está instalado
echo "1. Verificando yt-dlp..."
if command -v yt-dlp &> /dev/null; then
    echo "   ✓ yt-dlp encontrado: $(yt-dlp --version)"
else
    echo "   ❌ yt-dlp não encontrado, instalando..."
    pip install -U yt-dlp
fi

# 2. Verificar Chrome/Chromium
echo "2. Verificando navegador..."
if command -v google-chrome &> /dev/null; then
    echo "   ✓ Google Chrome encontrado: $(google-chrome --version)"
elif command -v chromium &> /dev/null; then
    echo "   ✓ Chromium encontrado: $(chromium --version)"
elif command -v chromium-browser &> /dev/null; then
    echo "   ✓ Chromium Browser encontrado: $(chromium-browser --version)"
else
    echo "   ⚠️  Nenhum navegador Chrome/Chromium encontrado"
    echo "   Instale com: sudo apt install google-chrome-stable"
fi

# 3. Verificar caminhos de cookies
echo "3. Verificando caminhos de cookies..."
CHROME_PATHS=(
    "$HOME/.config/google-chrome"
    "$HOME/.var/app/com.google.Chrome"
    "$HOME/.config/chromium"
    "$HOME/snap/chromium/current/.config/chromium"
)

FOUND_PATH=""
for path in "${CHROME_PATHS[@]}"; do
    if [ -d "$path" ]; then
        echo "   ✓ Encontrado: $path"
        if [ -z "$FOUND_PATH" ]; then
            FOUND_PATH="$path"
        fi
    fi
done

if [ -z "$FOUND_PATH" ]; then
    echo "   ❌ Nenhum caminho de cookies encontrado"
    echo "   Certifique-se de que o Chrome está instalado e você fez login no YouTube"
else
    echo "   🎯 Usando: $FOUND_PATH"
fi

# 4. Testar yt-dlp com cookies
echo "4. Testando yt-dlp com cookies..."
if [ -n "$FOUND_PATH" ]; then
    echo "   Comando: yt-dlp --cookies-from-browser chrome:$FOUND_PATH --dump-json --no-warnings 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' | head -1"
    
    # Testar apenas os primeiros dados para não sobrecarregar
    if timeout 30s yt-dlp --cookies-from-browser "chrome:$FOUND_PATH" --dump-json --no-warnings 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' | head -1 | grep -q '"title"'; then
        echo "   ✓ Teste de cookies bem-sucedido!"
    else
        echo "   ❌ Teste de cookies falhou"
    fi
else
    echo "   ⏭️  Pulando teste (sem caminho de cookies)"
fi

# 5. Configuração recomendada para .env
echo "5. Configuração recomendada para .env:"
if [ -n "$FOUND_PATH" ]; then
    echo "   YOUTUBE_COOKIES_FROM_BROWSER=chrome"
    echo "   YOUTUBE_COOKIES_PATH=$FOUND_PATH"
else
    echo "   YOUTUBE_COOKIES_FROM_BROWSER=chrome"
    echo "   YOUTUBE_COOKIES_PATH="
    echo "   (deixe vazio para detecção automática)"
fi

echo ""
echo "🎉 Configuração concluída!"
echo "Execute 'npm run test-cookies' para testar a integração completa."