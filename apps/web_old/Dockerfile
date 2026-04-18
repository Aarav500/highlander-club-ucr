# ── Stage 1: Build Expo web app from mobile source ───────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Copy mobile package files for layer caching
COPY apps/mobile/package.json apps/mobile/package-lock.json* ./

RUN npm ci

# Copy full mobile source
COPY apps/mobile/ ./

# Export Expo web build
RUN npx expo export --platform web --output-dir /dist

# ── Stage 2: Serve with Express ───────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY apps/web/package.json apps/web/package-lock.json* ./

RUN npm ci --omit=dev

COPY apps/web/server.js ./
COPY --from=builder /dist ./dist/

EXPOSE 8080

CMD ["node", "server.js"]
