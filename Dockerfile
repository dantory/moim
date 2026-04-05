# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY .npmrc ./
RUN npm ci --legacy-peer-deps

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

# Install necessary packages
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install production dependencies only
RUN npm ci --legacy-peer-deps --only=production

# Copy prisma schema and migrations
COPY prisma ./prisma/

# Generate Prisma Client for production
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 8080

ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
