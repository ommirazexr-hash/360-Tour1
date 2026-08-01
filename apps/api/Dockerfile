FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ─── Builder Stage ─────────────────────────────────
FROM base AS builder
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY prisma ./prisma

RUN pnpm --filter @vt/api build

# ─── Runner Stage ──────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 apiuser

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p uploads && chown -R apiuser:nodejs /app
USER apiuser

EXPOSE 4000
CMD ["node", "dist/server.js"]
