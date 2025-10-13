# Dockerfile simples e funcional para Railway
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

# Instalar yt-dlp
RUN python3 -m pip install --upgrade --break-system-packages yt-dlp

# Copiar arquivos do projeto
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY src ./src
COPY railway-setup.sh ./

# Copiar .env
COPY .env .env
COPY src/cookies/cookies.txt src/cookies/cookies.txt

# Instalar ALL dependencies (including devDependencies for build)
RUN npm ci

# Compilar TypeScript
RUN npm run build

# Remover devDependencies para reduzir tamanho
RUN npm prune --production

# Configurar permissions e diretórios
RUN chmod +x railway-setup.sh && \
    mkdir -p /app/public/audios

# Configurar ambiente
ENV NODE_ENV=production
ENV PYTHONIOENCODING=utf-8

EXPOSE 3000

CMD ["sh", "-c", "./railway-setup.sh && node dist/index.js"]
