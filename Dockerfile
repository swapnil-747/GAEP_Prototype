# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runner (The "Standalone" Runner)
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# We only copy the standalone folder and public assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
# The server entry point for standalone is server.js
CMD ["node", "server.js"]