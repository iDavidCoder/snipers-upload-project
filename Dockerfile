# Versão simplificada para Railway
FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema e yt-dlp
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    bash && \
    python3 -m pip install --upgrade --break-system-packages yt-dlp

# Copiar arquivos de dependências e instalar
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copiar código fonte e compilar
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Copiar script de setup
COPY railway-setup.sh ./
RUN chmod +x railway-setup.sh

# Criar diretórios necessários
RUN mkdir -p /app/public/audios

# Configurar ambiente
ENV NODE_ENV=production
ENV PYTHONIOENCODING=utf-8

EXPOSE 3000

# Comando de inicialização
CMD ["sh", "-c", "./railway-setup.sh && node dist/index.js"]
