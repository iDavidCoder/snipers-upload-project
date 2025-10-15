# 🔧 Solução para Problema de Cookies do YouTube

## ❌ Problema Original
```
ERROR: [youtube] YYMSo8Yu04A: Sign in to confirm you're not a bot. Use --cookies-from-browser or --cookies for the authentication.
```

## ✅ Solução Implementada

### 1. **Arquivos Modificados/Criados**

#### `src/config/env.ts`
- ➕ Adicionadas configurações de cookies:
  - `YOUTUBE_COOKIES_FROM_BROWSER` (padrão: "chrome")
  - `YOUTUBE_COOKIES_PATH` (para caminhos customizados)

#### `src/utils/cookies.ts` (NOVO)
- 🧠 Detecção automática de caminhos de cookies do Chrome
- 🔍 Validação de suporte a cookies do yt-dlp
- 🛠️ Geração de argumentos corretos para yt-dlp

#### `src/services/youtubeAudio.ts`
- 🔄 Integração com sistema de detecção de cookies
- 📝 Logs detalhados para debug
- 🎯 Aplicação automática de argumentos de cookies

#### `test-cookies.js` (NOVO)
- 🧪 Script de teste completo para verificar configuração
- 📊 Relatório detalhado do status da configuração

#### `setup-cookies.sh` (NOVO)
- 🐧 Script de configuração para Linux/Hostinger
- ✅ Verificação automática de dependências

#### `.env.example`
- 📖 Documentação das novas variáveis de ambiente

#### `COOKIES-SETUP.md` (NOVO)
- 📚 Guia completo de configuração e troubleshooting

### 2. **Como Usar**

#### No seu servidor Linux (Hostinger/EasyPanel):

1. **Configure o ambiente:**
```bash
chmod +x setup-cookies.sh
./setup-cookies.sh
```

2. **Configure as variáveis no .env:**
```bash
# Para Chrome padrão (auto-detecta)
YOUTUBE_COOKIES_FROM_BROWSER=chrome
YOUTUBE_COOKIES_PATH=

# Para Chrome Flatpak (se necessário)
YOUTUBE_COOKIES_FROM_BROWSER=chrome
YOUTUBE_COOKIES_PATH=~/.var/app/com.google.Chrome
```

3. **Teste a configuração:**
```bash
npm run test-cookies
```

### 3. **O que Acontece Automaticamente**

1. 🔍 **Detecção Automática**: Sistema detecta onde estão os cookies do Chrome
2. 🔐 **Autenticação**: yt-dlp usa os cookies para autenticar no YouTube
3. 📊 **Logs Detalhados**: Mostra exatamente quais argumentos estão sendo usados
4. ⚡ **Fallback**: Se cookies não estiverem disponíveis, tenta sem eles

### 4. **Logs que Você Verá**

```
Suporte a cookies do yt-dlp: Sim
Configuração de cookies detectada automaticamente: chrome:~/.config/google-chrome
Argumentos de cookies adicionados: --cookies-from-browser chrome:~/.config/google-chrome
Executando yt-dlp com argumentos: --no-warnings --cookies-from-browser chrome:~/.config/google-chrome --dump-json https://youtube.com/watch?v=...
```

### 5. **Pré-requisitos Importantes**

- ✅ Chrome/Chromium instalado no servidor
- ✅ Login feito no YouTube pelo Chrome (pelo menos uma vez)
- ✅ yt-dlp atualizado (`pip install -U yt-dlp`)

### 6. **Para Testar Localmente**

```bash
# Instalar dependências
npm install

# Testar configuração de cookies
npm run test-cookies

# Executar servidor
npm run dev
```

## 🚀 Deploy no Hostinger/EasyPanel

1. **Faça push das mudanças**
2. **No servidor, execute:**
```bash
./setup-cookies.sh
npm run test-cookies
```
3. **Configure as variáveis de ambiente no painel**
4. **Reinicie a aplicação**

## 🎯 Resultado Esperado

Após implementar essas mudanças, o erro de autenticação do YouTube deve ser resolvido, e você deve conseguir baixar áudios de vídeos que antes falhavam com o erro de "Sign in to confirm you're not a bot".