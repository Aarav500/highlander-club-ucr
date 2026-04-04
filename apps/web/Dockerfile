FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy server and pre-built static files
COPY server.js ./
COPY dist/ ./dist/

# Expose web port
EXPOSE 8080

CMD ["node", "server.js"]
