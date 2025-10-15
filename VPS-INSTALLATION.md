# 🚀 Guia de Instalação na VPS para Cookies do YouTube

## 📋 O que instalar na VPS

### 1. **Dependências Básicas**
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python e pip (necessário para yt-dlp)
sudo apt install python3 python3-pip -y

# Instalar ffmpeg (necessário para conversão de áudio)
sudo apt install ffmpeg -y

# Instalar Node.js e npm (se não estiver instalado)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. **Instalar yt-dlp**
```bash
# Instalar yt-dlp via pip (recomendado)
pip3 install -U yt-dlp

# Verificar instalação
yt-dlp --version

# Verificar se suporta cookies
yt-dlp --help | grep -i cookies
```

### 3. **Instalar Chrome/Chromium para Cookies**

#### Opção A: Google Chrome (Recomendado)
```bash
# Baixar e instalar Google Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install google-chrome-stable -y
```

#### Opção B: Chromium (Alternativa)
```bash
sudo apt install chromium-browser -y
```

### 4. **Configurar Chrome Headless (Para VPS sem interface gráfica)**
```bash
# Testar se Chrome funciona em modo headless
google-chrome --headless --no-sandbox --disable-gpu --version
```

## 🔧 Configuração do .env na VPS

Crie/edite o arquivo `.env` na raiz do projeto:

```bash
# Configurações básicas
PORT=3000
BASE_URL=https://seu-dominio.com  # Substitua pela URL da sua VPS

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob
GOOGLE_REFRESH_TOKEN=your_refresh_token

# YouTube configurações
YOUTUBE_DEFAULT_PRIVACY=private
YOUTUBE_CATEGORY_ID=22
YOUTUBE_REGION_CODE=BR

# Cookies do Chrome
YOUTUBE_COOKIES_FROM_BROWSER=chrome
YOUTUBE_COOKIES_PATH=

# Callback URL
CALLBACK_URL=https://seu-dominio.com/callback
```

## 🍪 Configuração de Cookies na VPS

### Método 1: Copiar cookies do seu computador local (Recomendado)

1. **No seu computador local:**
   - Faça login no YouTube pelo Chrome
   - Copie os cookies usando uma extensão ou exportação manual

2. **Na VPS:**
```bash
# Criar pasta do Chrome
mkdir -p ~/.config/google-chrome/Default

# Copiar cookies (você precisará transferir o arquivo de cookies)
# Exemplo com scp:
scp cookies.txt user@sua-vps:~/.config/google-chrome/Default/
```

### Método 2: Login direto na VPS (Complexo - não recomendado)

```bash
# Instalar X11 forwarding para interface gráfica temporária
sudo apt install xvfb -y

# Executar Chrome com display virtual
xvfb-run -a google-chrome --no-sandbox
```

### Método 3: Usar cookies.txt (Alternativa)

```bash
# Se você tiver um arquivo cookies.txt do YouTube
# Modifique o código para usar --cookies em vez de --cookies-from-browser
```

## 🧪 Testar a Configuração

1. **Executar script de teste:**
```bash
npm run test-cookies
```

2. **Testar manualmente:**
```bash
# Testar yt-dlp com cookies
yt-dlp --cookies-from-browser chrome --dump-json "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

3. **Verificar caminhos de cookies:**
```bash
ls -la ~/.config/google-chrome/Default/
ls -la ~/.var/app/com.google.Chrome/config/google-chrome/Default/ # Para Flatpak
```

## 🐳 Docker (Alternativa)

Se preferir usar Docker, aqui está um Dockerfile atualizado:

```dockerfile
FROM node:18-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \\
    python3 \\
    python3-pip \\
    ffmpeg \\
    wget \\
    gnupg \\
    && rm -rf /var/lib/apt/lists/*

# Instalar Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \\
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \\
    && apt-get update \\
    && apt-get install -y google-chrome-stable \\
    && rm -rf /var/lib/apt/lists/*

# Instalar yt-dlp
RUN pip3 install -U yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 🔍 Troubleshooting Comum

### Erro: "Cannot find chrome executable"
```bash
# Verificar onde está instalado o Chrome
which google-chrome
which chromium
which chromium-browser

# Definir caminho manualmente se necessário
export CHROME_EXECUTABLE=/usr/bin/google-chrome
```

### Erro: "No cookies found"
```bash
# Verificar se existe pasta de cookies
ls -la ~/.config/google-chrome/Default/

# Verificar permissões
chmod 755 ~/.config/google-chrome/
chmod 644 ~/.config/google-chrome/Default/*
```

### Erro: "yt-dlp not found"
```bash
# Verificar instalação
which yt-dlp
pip3 show yt-dlp

# Adicionar ao PATH se necessário
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## 📝 Checklist Final

- [ ] ✅ Python3 e pip instalados
- [ ] ✅ ffmpeg instalado
- [ ] ✅ yt-dlp instalado e atualizado
- [ ] ✅ Chrome/Chromium instalado
- [ ] ✅ Cookies do YouTube configurados
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Teste `npm run test-cookies` passou
- [ ] ✅ Pasta `public/audios` criada e com permissões corretas
- [ ] ✅ BASE_URL configurada com domínio correto

Após seguir todos os passos, os áudios baixados ficarão disponíveis em `https://seu-dominio.com/audios/nome-do-arquivo.mp3`