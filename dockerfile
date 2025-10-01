# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache ffmpeg python3 py3-pip && \
    pip3 install yt-dlp

# Instalar dependências Node
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar código e buildar
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Etapa final (runtime)//
FROM node:20-alpine
WORKDIR /app

# Copiar apenas build e dependências
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# ffmpeg e yt-dlp também no runtime
RUN apk add --no-cache ffmpeg python3 py3-pip && \
    pip3 install yt-dlp

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
