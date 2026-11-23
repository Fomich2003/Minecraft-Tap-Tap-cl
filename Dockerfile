# Фронтенд Minecraft Tap-Tap: збирання Vite → статика в nginx (без root)

# ─── 1. Збирання ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Адреса API вшивається в бандл під час збирання, змінити її після вже не можна
ARG VITE_API_URL=https://api-tap-tap.fomka.online
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ─── 2. Роздача ──────────────────────────────────────────────────────────────
# nginx-unprivileged працює під uid 101 і слухає 8080, тож йому не потрібні жодні capabilities
FROM nginxinc/nginx-unprivileged:1.28-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
