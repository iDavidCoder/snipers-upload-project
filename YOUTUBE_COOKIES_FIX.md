# Solução para Erro "Sign in to confirm you're not a bot"

## Problema
O YouTube está bloqueando o yt-dlp com a mensagem:
```
ERROR: [youtube] Sign in to confirm you're not a bot. Use --cookies-from-browser or --cookies for the authentication.
```

## Solução Implementada
O código foi atualizado para automaticamente usar cookies do navegador Chrome, o que resolve o bloqueio do YouTube.

### Como Funciona
1. O código tenta exportar cookies do Chrome automaticamente
2. Usa esses cookies nas requisições do yt-dlp
3. Adiciona headers e user-agent para simular um navegador real
4. Implementa delays entre requisições para evitar detecção

### Pré-requisitos
1. **Chrome instalado** no servidor/máquina
2. **Login no YouTube** feito no Chrome pelo menos uma vez
3. **yt-dlp atualizado** (versão mais recente)

## Testando
Execute o teste para verificar se funciona:
```bash
npm run test-youtube
```

## Soluções Alternativas

### Opção 1: Cookies Manuais
Se a exportação automática não funcionar, você pode exportar manualmente:

1. Instale a extensão "Get cookies.txt" no Chrome
2. Acesse youtube.com
3. Exporte os cookies para um arquivo `youtube_cookies.txt`
4. Coloque o arquivo na raiz do projeto

### Opção 2: Usar Firefox
```bash
yt-dlp --cookies-from-browser firefox [URL]
```

### Opção 3: Usar Opera/Edge
```bash
yt-dlp --cookies-from-browser opera [URL]
yt-dlp --cookies-from-browser edge [URL]
```

## Parâmetros Adicionados
- `--cookies-from-browser chrome`: Usa cookies do Chrome
- `--user-agent`: Simula navegador real
- `--add-header`: Adiciona headers HTTP realistas
- `--extractor-retries 3`: Tenta novamente em caso de falha
- `--sleep-interval`: Adiciona delays para evitar detecção

## Se o Problema Persistir
1. Verifique se está logado no YouTube no Chrome
2. Limpe cookies do Chrome e faça login novamente
3. Atualize o yt-dlp: `pip install --upgrade yt-dlp`
4. Verifique se o Chrome tem permissões adequadas

## Código de Erro Common
- `invalid_grant`: Problema com tokens do Google (diferente deste caso)
- `Sign in to confirm you're not a bot`: Resolvido com cookies
- `Private video`: Vídeo não é público
- `Video unavailable`: Vídeo foi removido ou restrito por região