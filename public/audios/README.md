# Pasta de Áudios

Esta pasta armazena os arquivos de áudio baixados do YouTube.

## Estrutura
- Os arquivos são salvos com o formato: `titulo-videoId-timestamp.mp3`
- Acessíveis via URL: `https://seu-dominio.com/audios/nome-do-arquivo.mp3`

## Limpeza
Para limpar arquivos antigos, você pode criar um cron job:

```bash
# Remover arquivos com mais de 7 dias
find /caminho/para/projeto/public/audios -name "*.mp3" -mtime +7 -delete
```

## Permissões
Certifique-se de que a pasta tem permissões corretas:

```bash
chmod 755 public/audios
chmod 644 public/audios/*.mp3
```