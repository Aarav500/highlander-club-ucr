FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy source code
COPY src/ ./src/

# Expose API port
EXPOSE 3001

# Run migrations then start the server
CMD ["sh", "-c", "node src/db/migrate.js && node src/index.js"]
