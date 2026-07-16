# --- Base ---
FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci

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
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# "output: standalone" bundles the server and its deps into .next/standalone,
# so this stage needs no npm install. Static assets are not bundled.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
