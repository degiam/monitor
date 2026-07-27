FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++
RUN mkdir -p /data

COPY package*.json ./
RUN npm ci
COPY . .

ARG PUBLIC_APP_NAME
ENV PUBLIC_APP_NAME=$PUBLIC_APP_NAME

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN mkdir -p /data && chown -R node:node /data
VOLUME /data

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "build"]