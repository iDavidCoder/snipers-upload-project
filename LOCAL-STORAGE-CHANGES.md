# 📁 Mudanças: Salvar Áudios Localmente

## ✅ Modificações Realizadas

### 1. **youtubeAudio.ts** - Mudança Principal
❌ **ANTES**: Upload para Supabase
```typescript
// Upload para bucket Audios
const { error } = await supabase.storage.from("Audios").upload(finalFileName, fileBuffer, {
  upsert: true,
  contentType: "audio/mpeg"
});
const publicUrl = `${env.supabase.url}/storage/v1/object/public/Audios/${finalFileName}`;
```

✅ **AGORA**: Salvamento local
```typescript
// Mover arquivo para pasta pública
await fs.mkdir(join(process.cwd(), "public", "audios"), { recursive: true });
await fs.copyFile(tempAudioPath, publicAudioPath);
const publicUrl = `${env.baseUrl}/audios/${finalFileName}`;
```

### 2. **index.ts** - Servir Arquivos Estáticos
✅ **Adicionado**: Middleware Express para servir arquivos
```typescript
// Servir arquivos estáticos da pasta public
app.use(express.static(join(process.cwd(), "public")));
```

### 3. **env.ts** - Nova Configuração
✅ **Adicionado**: BASE_URL para URLs públicas
```typescript
baseUrl: process.env.BASE_URL || "http://localhost:3000"
```

### 4. **Estrutura de Pastas**
```
public/
└── audios/
    ├── README.md
    └── [arquivos .mp3 gerados]
```

## 🌐 Como Funciona Agora

1. **Download**: yt-dlp baixa e converte para MP3 na pasta temporária
2. **Salvamento**: Arquivo é movido para `public/audios/`
3. **URL Pública**: Retorna `https://seu-dominio.com/audios/arquivo.mp3`
4. **Acesso**: Express serve estaticamente via middleware

## ⚙️ Configuração na VPS

### 1. **Instalar Dependências**
```bash
# Executar script automatizado
chmod +x vps-setup.sh
./vps-setup.sh
```

### 2. **Configurar .env**
```bash
BASE_URL=https://seu-dominio.com
YOUTUBE_COOKIES_FROM_BROWSER=chrome
YOUTUBE_COOKIES_PATH=  # Deixe vazio para auto-detecção
```

### 3. **O que instalar na VPS**
- ✅ **Python3 + pip** (para yt-dlp)
- ✅ **ffmpeg** (para conversão de áudio)
- ✅ **Google Chrome** (para cookies do YouTube)
- ✅ **yt-dlp** (ferramenta principal)

### 4. **Comandos de Instalação Manual**
```bash
# Dependências básicas
sudo apt update && sudo apt install -y python3 python3-pip ffmpeg

# yt-dlp
pip3 install -U yt-dlp

# Google Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update && sudo apt install -y google-chrome-stable
```

## 🍪 Configuração de Cookies

### Método Recomendado
1. **No seu computador**: Faça login no YouTube pelo Chrome
2. **Na VPS**: O sistema detecta automaticamente os cookies

### Caminhos de Cookies Detectados
- `~/.config/google-chrome` (Chrome padrão)
- `~/.var/app/com.google.Chrome` (Chrome Flatpak)
- `~/.config/chromium` (Chromium)

## 🧪 Testar Configuração

```bash
# Testar instalação completa
npm run test-cookies

# Testar manualmente yt-dlp
yt-dlp --cookies-from-browser chrome --dump-json "https://youtube.com/watch?v=dQw4w9WgXcQ"
```

## 🎯 Vantagens da Nova Abordagem

1. **Performance**: Sem upload/download para Supabase
2. **Simplicidade**: Arquivos ficam no servidor
3. **Custo**: Sem custos de storage externo
4. **Velocidade**: Acesso direto aos arquivos
5. **Controle**: Fácil de gerenciar e limpar arquivos antigos

## 📊 URLs Resultantes

**Antes**: `https://supabase.co/storage/v1/object/public/Audios/arquivo.mp3`
**Agora**: `https://seu-dominio.com/audios/arquivo.mp3`

## 🔧 Manutenção

### Limpeza Automática (Opcional)
```bash
# Cron job para remover arquivos antigos (7 dias)
0 2 * * * find /caminho/projeto/public/audios -name "*.mp3" -mtime +7 -delete
```

### Monitoramento de Espaço
```bash
# Verificar espaço usado
du -sh public/audios/

# Contar arquivos
ls public/audios/*.mp3 | wc -l
```

Agora os áudios ficam armazenados localmente e são servidos diretamente pelo Express! 🎉