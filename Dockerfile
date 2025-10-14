# Dockerfile para Railway com yt-dlp otimizado
FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    bash

# Instalar yt-dlp mais recente
RUN python3 -m pip install --upgrade --break-system-packages yt-dlp

# Copiar arquivos do projeto
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY src ./src

# Verificar se cookies existem e copiar
COPY .env .env

# Instalar ALL dependencies (including devDependencies for build)
RUN npm ci

# Compilar TypeScript
RUN npm run build

# Remover devDependencies para reduzir tamanho
RUN npm prune --production

# Criar diretório tmp para downloads
RUN mkdir -p tmp && chmod 777 tmp

# Configurar ambiente
ENV NODE_ENV=production
ENV PYTHONIOENCODING=utf-8

EXPOSE 8080

CMD ["node", "dist/index.js"]
