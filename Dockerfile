# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache ffmpeg python3 py3-pip && \
    pip3 install yt-dlp --break-system-packages

# Instalar dependências Node
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar código e buildar
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV PORT=3000

# Etapa final (runtime)
FROM node:20-alpine
WORKDIR /app

# Copiar build e dependências
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# ffmpeg, yt-dlp e chromium
RUN apk add --no-cache ffmpeg python3 py3-pip chromium && \
    pip3 install yt-dlp --break-system-packages

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
