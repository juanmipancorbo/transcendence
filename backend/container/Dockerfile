# --- Base ---
FROM node:24-bookworm-slim AS base
WORKDIR /app
COPY ../app/package*.json ./
COPY ./.env ./
RUN apt-get update && apt-get install -y openssl && apt-get install curl && rm -rf /var/lib/apt/lists/*

# --- Development ---
FROM base AS development
# TODO remove the true
RUN npm install || true
COPY ../app ./
CMD ["npm", "run", "start"]

# --- Builder ---
FROM base AS builder
RUN npm install
COPY ../app ./
RUN npm run build

# --- Production ---
FROM base AS production
ENV NODE_ENV=production
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]