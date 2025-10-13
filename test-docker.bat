@echo off
echo 🧪 Testando Build Local do Docker...

REM Verificar se Docker está rodando
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker não está rodando. Inicie o Docker Desktop primeiro.
    pause
    exit /b 1
)

REM Build da imagem
echo 🔨 Buildando imagem Docker...
docker build -t youtube-audio-test .

if %errorlevel% neq 0 (
    echo ❌ Falha no build da imagem Docker
    pause
    exit /b 1
)

echo ✅ Build concluído com sucesso!

REM Executar container para teste
echo 🚀 Iniciando container de teste...
docker run --rm -p 3000:3000 -e PORT=3000 -e NODE_ENV=production youtube-audio-test

echo 🌐 Container iniciado em http://localhost:3000
echo 💡 Pressione Ctrl+C para parar o container