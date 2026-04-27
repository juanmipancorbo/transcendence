# --- Base ---
FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

# --- Development ---
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- Builder ---
FROM base AS builder
COPY . .
RUN npm run build

# --- Production ---
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

EXPOSE 3000

CMD ["npm", "start"]