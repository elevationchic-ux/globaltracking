# syntax=docker/dockerfile:1

# ---- Dependencies (cached layer) ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Runtime ----
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Run as unprivileged user
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:${PORT:-3001}/health || exit 1

CMD ["node", "src/index.js"]
