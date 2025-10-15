#!/bin/bash

# Script de instalação automatizada para VPS
# Execute: chmod +x vps-setup.sh && ./vps-setup.sh

set -e  # Parar em caso de erro

echo "🚀 Configurando VPS para yt-dlp com cookies..."
echo "================================================"

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   echo "❌ Não execute este script como root!"
   echo "Execute: sudo -u seuusuario ./vps-setup.sh"
   exit 1
fi

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependências básicas
echo "🔧 Instalando dependências básicas..."
sudo apt install -y \\
    python3 \\
    python3-pip \\
    ffmpeg \\
    wget \\
    curl \\
    gnupg \\
    software-properties-common

# 3. Instalar Node.js se não estiver instalado
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"

# 4. Instalar yt-dlp
echo "📺 Instalando yt-dlp..."
pip3 install -U yt-dlp

# Adicionar pip local bin ao PATH se necessário
if ! echo $PATH | grep -q "$HOME/.local/bin"; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    export PATH="$HOME/.local/bin:$PATH"
fi

echo "✅ yt-dlp: $(yt-dlp --version)"

# 5. Instalar Google Chrome
echo "🌐 Instalando Google Chrome..."
if ! command -v google-chrome &> /dev/null; then
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
    sudo apt update
    sudo apt install -y google-chrome-stable
fi

echo "✅ Chrome: $(google-chrome --version)"

# 6. Testar Chrome headless
echo "🧪 Testando Chrome headless..."
if google-chrome --headless --no-sandbox --disable-gpu --version &> /dev/null; then
    echo "✅ Chrome headless funcionando"
else
    echo "⚠️  Chrome headless com problemas - pode afetar cookies"
fi

# 7. Criar estrutura de pastas
echo "📁 Criando estrutura de pastas..."
mkdir -p ~/.config/google-chrome/Default
mkdir -p public/audios

# 8. Verificar suporte a cookies no yt-dlp
echo "🍪 Verificando suporte a cookies..."
if yt-dlp --help | grep -q "cookies-from-browser"; then
    echo "✅ yt-dlp suporta cookies"
else
    echo "❌ yt-dlp não suporta cookies - versão muito antiga"
    echo "Tentando atualizar..."
    pip3 install -U yt-dlp
fi

# 9. Instalar dependências do projeto
if [ -f "package.json" ]; then
    echo "📦 Instalando dependências do projeto..."
    npm ci
else
    echo "⚠️  package.json não encontrado - execute este script na raiz do projeto"
fi

# 10. Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo "⚙️  Criando arquivo .env..."
    cp .env.example .env
    echo ""
    echo "🔧 IMPORTANTE: Configure as variáveis no arquivo .env"
    echo "   - BASE_URL: https://seu-dominio.com"
    echo "   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc."
    echo ""
fi

# 11. Teste básico
echo "🧪 Executando teste básico..."
if [ -f "test-cookies.js" ]; then
    echo "Executando teste de cookies..."
    timeout 60s npm run test-cookies || echo "⚠️  Teste de cookies falhou ou demorou muito"
else
    echo "⚠️  Arquivo de teste não encontrado"
fi

# 12. Resumo final
echo ""
echo "🎉 Instalação concluída!"
echo "======================================"
echo "✅ Python3 e pip: Instalados"
echo "✅ ffmpeg: Instalado"
echo "✅ yt-dlp: $(yt-dlp --version 2>/dev/null || echo 'Erro ao verificar')"
echo "✅ Google Chrome: Instalado"
echo "✅ Node.js: $(node --version)"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure o arquivo .env com suas credenciais"
echo "2. Configure cookies do YouTube (veja VPS-INSTALLATION.md)"
echo "3. Execute: npm run test-cookies"
echo "4. Execute: npm run dev (para desenvolvimento) ou npm start (produção)"
echo ""
echo "🍪 Para configurar cookies do YouTube:"
echo "   - Faça login no YouTube pelo Chrome no seu computador"
echo "   - Copie os cookies para a VPS ou use método alternativo"
echo "   - Veja detalhes em VPS-INSTALLATION.md"
echo ""
echo "🌐 Após configurar, os áudios estarão disponíveis em:"
echo "   https://seu-dominio.com/audios/nome-do-arquivo.mp3"