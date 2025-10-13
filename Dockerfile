# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar Python, pip, ffmpeg e dependências para yt-dlp
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    ca-certificates

# Instalar yt-dlp via pip (versão mais recente e estável)
RUN pip3 install --upgrade yt-dlp

# Instalar dependências Node
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar código e buildar
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Etapa final (runtime)
FROM node:20-alpine
WORKDIR /app

# Instalar apenas o necessário para runtime
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    && pip3 install --upgrade yt-dlp

# Copiar build e dependências
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./ 

# Copiar script de setup
COPY railway-setup.sh ./
RUN chmod +x railway-setup.sh

# Criar diretório para arquivos temporários
RUN mkdir -p /app/public/audios

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PYTHONIOENCODING=utf-8

# Não copiar .env no Docker (usar variáveis do Railway)
# COPY .env .env

EXPOSE 3000

# Executar setup e depois iniciar o servidor
CMD ["sh", "-c", "./railway-setup.sh && node dist/index.js"]
