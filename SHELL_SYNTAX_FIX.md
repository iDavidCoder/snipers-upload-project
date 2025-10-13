# Correções do Erro de Shell Syntax

## ❌ **Problema Original:**
```
Error: Falha ao obter informações do vídeo: /bin/sh: syntax error: unexpected "("
```

## 🔍 **Causa Raiz:**
O erro ocorria porque:
1. `shell: true` estava sendo usado no `spawn()`
2. URLs com caracteres especiais (parênteses, etc.) causavam problemas de sintaxe no shell
3. Falta de sanitização adequada das URLs de entrada

## ✅ **Correções Implementadas:**

### 1. **Removido `shell: true` de todos os spawns:**
```typescript
// Antes (problemático):
spawn("yt-dlp", args, { shell: true })

// Depois (seguro):
spawn("yt-dlp", args, { shell: false })
```

**Arquivos corrigidos:**
- `src/services/youtubeAudio.ts` (2 ocorrências)
- `src/utils/cookies.ts` (1 ocorrência) 
- `src/routes/webhook.ts` (1 ocorrência)

### 2. **Criado sistema robusto de sanitização:**
- **Novo arquivo:** `src/utils/sanitizer.ts`
- **Função:** `sanitizeYouTubeUrl()` - valida e limpa URLs
- **Função:** `sanitizeArguments()` - sanitiza argumentos gerais
- **Validação:** Regex para URLs do YouTube válidas
- **Reconstrução:** URLs padronizadas e seguras

### 3. **Melhorado logging e debug:**
```typescript
console.log('Executando yt-dlp com args:', args);
console.log(`URL sanitizada: ${sanitizedUrl}`);
```

## 🛡️ **Segurança Implementada:**

### Sanitização de URLs:
- ✅ Validação por regex
- ✅ Extração segura do video ID  
- ✅ Reconstrução de URL limpa
- ✅ Remoção de caracteres perigosos

### Prevenção de Shell Injection:
- ✅ `shell: false` em todos os spawns
- ✅ Argumentos tratados como array
- ✅ URLs sanitizadas antes do uso

## 🎯 **Resultado Esperado:**

Agora o sistema deve:
- ✅ Processar URLs com caracteres especiais sem erro
- ✅ Executar yt-dlp de forma segura
- ✅ Evitar problemas de shell injection
- ✅ Fornecer logs mais informativos

## 📝 **Exemplo de URL Problemática Resolvida:**
```
Entrada: https://youtube.com/watch?v=abc123&list=xyz(problema)
Sanitizada: https://www.youtube.com/watch?v=abc123
```

O erro "syntax error: unexpected "("" deve estar resolvido! 🚀