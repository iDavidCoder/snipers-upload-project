# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar ffmpeg + yt-dlp via apk (já resolvido no Alpine)
RUN apk add --no-cache ffmpeg yt-dlp

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

# Copiar apenas build e dependências
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./ 

# ffmpeg + yt-dlp também no runtime
RUN apk add --no-cache ffmpeg yt-dlp

ENV NODE_ENV=production
# Copiar .env
COPY .env .env

CMD ["node", "dist/index.js"]
