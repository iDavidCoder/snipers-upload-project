# Configuração de Cookies para yt-dlp

Este documento explica como resolver o erro de autenticação do YouTube que solicita cookies.

## O Problema

Você está vendo este erro:
```
ERROR: [youtube] YYMSo8Yu04A: Sign in to confirm you're not a bot. Use --cookies-from-browser or --cookies for the authentication.
```

## Solução Implementada

O sistema agora detecta automaticamente os cookies do Chrome e os usa com o yt-dlp.

### 1. Configuração Automática (Recomendada)

O sistema detecta automaticamente onde estão os cookies do Chrome:

- **Linux padrão**: `~/.config/google-chrome`
- **Linux com Flatpak**: `~/.var/app/com.google.Chrome`
- **Linux com Snap**: `~/snap/chromium/current/.config/chromium`

### 2. Configuração Manual

Se a detecção automática não funcionar, configure manualmente no arquivo `.env`:

```bash
# Para Chrome padrão no Linux
YOUTUBE_COOKIES_FROM_BROWSER=chrome
YOUTUBE_COOKIES_PATH=

# Para Chrome via Flatpak
YOUTUBE_COOKIES_FROM_BROWSER=chrome
YOUTUBE_COOKIES_PATH=~/.var/app/com.google.Chrome

# Para Chromium
YOUTUBE_COOKIES_FROM_BROWSER=chrome
YOUTUBE_COOKIES_PATH=~/.config/chromium
```

## Pré-requisitos

### 1. Chrome/Chromium Instalado

Certifique-se de ter o Chrome ou Chromium instalado:

```bash
# Ubuntu/Debian
sudo apt install google-chrome-stable
# ou
sudo apt install chromium-browser

# Para Flatpak
flatpak install flathub com.google.Chrome
```

### 2. Login no YouTube

1. Abra o Chrome/Chromium
2. Vá para youtube.com
3. Faça login na sua conta
4. Certifique-se de estar logado

### 3. yt-dlp Atualizado

```bash
pip install -U yt-dlp
```

## Testando a Configuração

Execute o script de teste para verificar se tudo está funcionando:

```bash
npm run test-cookies
```

Este script irá:
1. ✅ Verificar se yt-dlp suporta cookies
2. 🔍 Detectar automaticamente os caminhos de cookies
3. 🧪 Testar com um vídeo do YouTube
4. 📊 Mostrar um resumo da configuração

## Exemplo de Saída do Teste

```
🔍 Testando configuração de cookies do yt-dlp...

1. Verificando suporte a cookies do yt-dlp...
   ✓ Suporte a cookies: Sim

2. Detectando caminhos de cookies...
   ✓ Configuração encontrada: chrome:~/.config/google-chrome
   ✓ Argumentos: --cookies-from-browser chrome:~/.config/google-chrome

3. Testando com vídeo público do YouTube...
   ✓ Sucesso! Título: Rick Astley - Never Gonna Give You Up

📊 Resumo:
   yt-dlp instalado: ✓
   Cookies configurados: ✓
   Teste funcional: ✓

🎉 Configuração está funcionando!
```

## Resolução de Problemas

### Erro: "Cannot find cookies database"

**Problema**: yt-dlp não consegue encontrar o banco de dados de cookies do Chrome.

**Soluções**:
1. Certifique-se de que o Chrome está fechado antes de executar
2. Para Flatpak, use: `YOUTUBE_COOKIES_PATH=~/.var/app/com.google.Chrome`
3. Verifique se você está logado no YouTube pelo Chrome

### Erro: "No cookies found for youtube.com"

**Problema**: Não há cookies do YouTube salvos.

**Soluções**:
1. Abra o Chrome e faça login no YouTube
2. Visite alguns vídeos para gerar cookies
3. Feche o Chrome e tente novamente

### Erro: "yt-dlp command not found"

**Problema**: yt-dlp não está instalado ou não está no PATH.

**Soluções**:
```bash
# Instalar yt-dlp
pip install yt-dlp

# Ou atualizar
pip install -U yt-dlp

# Verificar instalação
yt-dlp --version
```

### Performance no Hostinger/EasyPanel

Para melhor performance no ambiente de produção:

1. **Instale yt-dlp globalmente**:
```bash
pip install -U yt-dlp
```

2. **Configure variáveis de ambiente**:
```bash
YOUTUBE_COOKIES_FROM_BROWSER=chrome
# Para Flatpak (se aplicável):
# YOUTUBE_COOKIES_PATH=~/.var/app/com.google.Chrome
```

3. **Mantenha o Chrome atualizado**:
```bash
# Verifique a versão do Chrome
google-chrome --version
```

## Como Funciona

1. **Detecção Automática**: O sistema verifica vários caminhos possíveis para cookies do Chrome
2. **Configuração Manual**: Permite override via variáveis de ambiente
3. **Validação**: Testa se yt-dlp suporta cookies antes de usar
4. **Logs Detalhados**: Mostra exatamente quais argumentos estão sendo usados

## Logs de Debug

O sistema agora mostra logs detalhados:

```
Suporte a cookies do yt-dlp: Sim
Configuração de cookies detectada automaticamente: chrome:~/.config/google-chrome
Argumentos de cookies adicionados: --cookies-from-browser chrome:~/.config/google-chrome
Executando yt-dlp com argumentos: --no-warnings --cookies-from-browser chrome:~/.config/google-chrome --dump-json https://youtube.com/watch?v=...
```

Isso ajuda a debugar problemas de configuração.