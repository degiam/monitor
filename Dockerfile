# Multi-stage Dockerfile for SvelteKit + SQLite (better-sqlite3)

# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3 native C++ module
RUN apk add --no-cache python3 make g++

# Copy package descriptors & install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build SvelteKit app (outputs standalone Node server to /app/build)
RUN npm run build

# Remove devDependencies to shrink node_modules size
RUN npm prune --omit=dev

# Stage 2: Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Default Environment Variables (Bisa di-override saat running container)
ENV DATABASE_URL=/data/monitor.db
ENV APP_PASSWORD=admin
ENV SESSION_SECRET=secret_change_me_in_prod

# Create persistent storage directory for SQLite database
RUN mkdir -p /data && chown -R node:node /data
VOLUME /data

# Copy built application and production node_modules from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER node

EXPOSE 3000

CMD ["node", "build"]
