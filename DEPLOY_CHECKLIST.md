# ✅ Checklist para Deploy no Railway

## 🏗️ Arquivos Configurados

- [x] **Dockerfile** - Corrigido para Alpine 3.22+ com `--break-system-packages`
- [x] **railway.toml** - Build configurado para usar Dockerfile  
- [x] **.dockerignore** - Otimização do build
- [x] **railway-setup.sh** - Script de inicialização melhorado com testes
- [x] **Código atualizado** - Anti-detecção para produção sem Chrome
- [x] **Scripts de teste** - `test-docker.bat` e `test-docker.sh` para testar localmente

## 🔧 Configurações Necessárias no Railway

### 1. Variáveis de Ambiente Obrigatórias:
```bash
PORT=3000
NODE_ENV=production
GOOGLE_CLIENT_ID=175140109046-gtcnk1drfm99onnglo4u4ala4vd4v8pp.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REFRESH_TOKEN=1//0hZo3r-KHM0rLCgYIARAAGBESNwF-L9IrRwSSprvW_NRd9LAbRwOr74zAIrQ-U_SFx0BRT7g3ACBurxW1I_Ml78dMhzMIZaudh-w
YOUTUBE_DEFAULT_PRIVACY=public
YOUTUBE_CATEGORY_ID=22
YOUTUBE_REGION_CODE=BR
SUPABASE_URL=https://ixjxafgunizibxlrmrep.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4anhhZmd1bml6aWJ4bHJtcmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzMyNzksImV4cCI6MjA2OTU0OTI3OX0.3-iR9cHv1MbGXVK9qBWJUaYiHNGfYQrOJzWgwsz-Bb4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4anhhZmd1bml6aWJ4bHJtcmVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk3MzI3OSwiZXhwIjoyMDY5NTQ5Mjc5fQ.k70aDnoocbzijNxAM7e76vale6sSFy-QoMTF2oS3-sY
SUPABASE_TABLE=request_queue
```

### 2. URLs que Precisam ser Atualizadas Após Deploy:
- `GOOGLE_REDIRECT_URI=https://SEU_DOMINIO.up.railway.app/oauth2callback`
- `CALLBACK_URL=https://SEU_DOMINIO.up.railway.app/webhook/9d30e1aa-2261-4008-9581-41eae4aeb5e3`

## 🚀 Passos para Deploy

### Via Railway CLI:
```bash
# 1. Login
railway login

# 2. Conectar projeto
railway link

# 3. Deploy
railway up
```

### Via GitHub (Recomendado):
1. Commit e push das mudanças
2. Conectar repositório no Railway Dashboard
3. Deploy automático será iniciado

## 🧪 Testando Após Deploy

### 1. Verificar Saúde do Servidor:
```bash
curl https://SEU_DOMINIO.up.railway.app/
```

### 2. Testar YouTube Audio API:
```bash
curl -X POST https://SEU_DOMINIO.up.railway.app/youtube-audio \
  -H "Content-Type: application/json" \
  -d '{"yt_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### 3. Verificar Logs:
```bash
railway logs
```

## 🔧 Diferenças entre Local e Railway

| Aspecto | Local (Dev) | Railway (Prod) |
|---------|-------------|----------------|
| **Cookies** | Tenta usar Chrome | Headers anti-detecção |
| **yt-dlp** | Via npm/sistema | Via pip no Docker |
| **ffmpeg** | Sistema local | Alpine package |
| **Variáveis** | .env file | Railway Environment |
| **Arquivos** | ./public/audios | /app/public/audios |

## ⚠️ Possíveis Problemas e Soluções

### 1. "Sign in to confirm you're not a bot"
- ✅ **Solucionado**: Headers HTTP convincentes em produção
- ✅ **Fallback**: User-Agent realista, delays, retry automático

### 2. Alpine 3.22+ "externally-managed-environment"
- ✅ **Solucionado**: `--break-system-packages` no pip
- ✅ **Método**: `python3 -m pip install --upgrade --break-system-packages yt-dlp`

### 3. TypeScript Build "tsc: not found"
- ✅ **Solucionado**: `npm ci` instala devDependencies para build
- ✅ **Otimização**: `npm prune --production` após build

### 4. Erro de CORS
- ✅ **Prevenido**: CORS configurado no Express

### 5. Timeout nos Downloads
- ✅ **Mitigado**: Retry automático e configurações otimizadas

### 6. Espaço em Disco
- ✅ **Gerenciado**: Cleanup automático de arquivos antigos

## 📊 Monitoramento

Após o deploy, monitore:
- **CPU/Memory usage** no Railway Dashboard
- **Response times** das APIs
- **Logs de erro** via `railway logs`
- **Espaço em disco** (arquivos de áudio)

## 🎯 Pronto para Deploy!

Todos os arquivos estão configurados e o código está otimizado para funcionar no Railway sem Chrome/cookies locais. O sistema usa estratégias de anti-detecção específicas para ambientes de servidor.