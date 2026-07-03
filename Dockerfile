# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install bun
RUN npm install -g bun

# Copy manifests
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || npm install --legacy-peer-deps

# Copy source
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:./db/masari.db

# Build
RUN npm run build 2>/dev/null || npx next build

# ─── Production Stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create db directory
RUN mkdir -p db && chown nextjs:nodejs db

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
