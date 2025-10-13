# Configurações do Railway para o projeto YouTube Audio

## Variáveis de Ambiente Necessárias no Railway

### Configurações do Servidor
```
PORT=3000
NODE_ENV=production
```

### Configurações do Google/YouTube
```
GOOGLE_CLIENT_ID=175140109046-gtcnk1drfm99onnglo4u4ala4vd4v8pp.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://SEU_DOMINIO_RAILWAY.up.railway.app/oauth2callback
GOOGLE_REFRESH_TOKEN=1//0hZo3r-KHM0rLCgYIARAAGBESNwF-L9IrRwSSprvW_NRd9LAbRwOr74zAIrQ-U_SFx0BRT7g3ACBurxW1I_Ml78dMhzMIZaudh-w

YOUTUBE_DEFAULT_PRIVACY=public
YOUTUBE_CATEGORY_ID=22
YOUTUBE_REGION_CODE=BR
```

### Configurações do Supabase
```
SUPABASE_URL=https://ixjxafgunizibxlrmrep.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4anhhZmd1bml6aWJ4bHJtcmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NzMyNzksImV4cCI6MjA2OTU0OTI3OX0.3-iR9cHv1MbGXVK9qBWJUaYiHNGfYQrOJzWgwsz-Bb4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4anhhZmd1bml6aWJ4bHJtcmVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk3MzI3OSwiZXhwIjoyMDY5NTQ5Mjc5fQ.k70aDnoocbzijNxAM7e76vale6sSFy-QoMTF2oS3-sY
SUPABASE_TABLE=request_queue
```

### Configurações de Callback
```
CALLBACK_URL=https://SEU_DOMINIO_RAILWAY.up.railway.app/webhook/9d30e1aa-2261-4008-9581-41eae4aeb5e3
```

## Como Configurar no Railway

1. **Deploy do Projeto**:
   ```bash
   railway login
   railway link
   railway up
   ```

2. **Definir Variáveis de Ambiente**:
   ```bash
   railway variables set PORT=3000
   railway variables set NODE_ENV=production
   # ... adicionar todas as outras variáveis
   ```

3. **Ou pela Interface Web**:
   - Acesse o dashboard do Railway
   - Vá em Settings > Environment
   - Adicione cada variável uma por vez

## Arquivos Importantes para o Railway

- `Dockerfile` - Configuração do container
- `railway.toml` - Configuração do build
- `.dockerignore` - Arquivos ignorados no build
- `railway-setup.sh` - Script de inicialização

## URLs Importantes

Após o deploy, suas URLs serão:
- **App**: `https://SEU_PROJETO.up.railway.app`
- **YouTube Audio API**: `https://SEU_PROJETO.up.railway.app/youtube-audio`
- **Arquivos de Áudio**: `https://SEU_PROJETO.up.railway.app/audios/NOME_DO_ARQUIVO.mp3`

## Testando o Deploy

```bash
curl -X POST https://SEU_PROJETO.up.railway.app/youtube-audio \
  -H "Content-Type: application/json" \
  -d '{"yt_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## Troubleshooting

- **Logs**: `railway logs`
- **Redeploy**: `railway up --detach`
- **Variáveis**: `railway variables`