FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY app/package.json app/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/app/node_modules ./app/node_modules
COPY . .
RUN pnpm --filter @x402sentinel/x402 build
RUN pnpm --filter sentinel-app build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/app/.next/standalone ./
COPY --from=builder /app/app/.next/static ./app/.next/static
COPY --from=builder /app/app/public ./app/public
RUN mkdir -p /data
EXPOSE 3000
ENV PORT=3000
ENV DATABASE_URL=file:/data/sentinel.db
CMD ["node", "app/server.js"]
