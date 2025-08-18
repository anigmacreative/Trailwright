# Install dependencies only when needed
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter ./apps/web build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/web/server.js"]
